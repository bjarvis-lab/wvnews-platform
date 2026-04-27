// POST /api/newsletters/push-to-cc
//
// Renders the newsletter (same code path as /preview), authenticates
// to Constant Contact via the stored refresh token, and creates a DRAFT
// email campaign in CC. Editors review + send from the CC dashboard.
//
// Body: { publication, hoursBack, storyCount, adCadence, sectioned, listId? }
// Returns: { ok, campaignId, dashboardUrl, listId }
//
// Required env (one-time setup — see /api/auth/cc-authorize):
//   CC_API_KEY            developer-app key
//   CC_APP_SECRET         developer-app secret
//   CC_REFRESH_TOKEN      from the OAuth dance
//   CC_FROM_EMAIL         verified sender in CC
//   CC_FROM_NAME          display name (defaults to publication name)
//   CC_DEFAULT_LIST_ID    fallback list when body.listId omitted

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';
import { sites } from '@/data/mock';
import {
  selectStoriesForNewsletter,
  selectAdsForNewsletter,
  renderNewsletterHtml,
} from '@/lib/newsletter-builder';
import { refreshAccessToken, createDraftCampaign } from '@/lib/cc-client';
import { getListIdForPublication } from '@/lib/newsletter-lists-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(user.profile, 'newsletters')) {
    return NextResponse.json({ error: 'Newsletters permission required.' }, { status: 403 });
  }

  // Validate Constant Contact env up front so the error is clear.
  const required = ['CC_API_KEY', 'CC_APP_SECRET', 'CC_REFRESH_TOKEN', 'CC_FROM_EMAIL'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    return NextResponse.json({
      error: 'Constant Contact not fully configured.',
      missingEnv: missing,
      next: missing.includes('CC_REFRESH_TOKEN')
        ? 'Visit /api/auth/cc-authorize while signed in as admin to mint a refresh token.'
        : 'Add the missing values to Vercel env (Production + Preview), then redeploy.',
    }, { status: 501 });
  }

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const {
    publication: pubId = 'wvnews',
    hoursBack = 24,
    storyCount = 14,
    adCadence = 3,
    sectioned = true,
    listId,
  } = body;

  const publication = sites.find(s => s.id === pubId) || sites[0];

  // Build content (same path as /preview)
  let stories = [];
  let ads = [];
  try {
    stories = await selectStoriesForNewsletter({ publication: pubId, hoursBack, count: storyCount });
  } catch (err) {
    return NextResponse.json({ error: `Story selection failed: ${err.message}` }, { status: 500 });
  }
  try {
    ads = await selectAdsForNewsletter({ count: 8, publication: pubId });
  } catch {/* ads optional */}
  if (!stories.length) {
    return NextResponse.json({ error: `No stories found for ${publication.name} in the last ${hoursBack}h.` }, { status: 400 });
  }

  const platformUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const siteBaseUrl = publication.domain ? `https://${publication.domain}` : platformUrl;
  const html = renderNewsletterHtml({
    publication,
    stories,
    ads,
    adCadence: Number(adCadence) || 3,
    sectioned: !!sectioned,
    siteBaseUrl,
    // CC fills these merge tags at send time. They're standard CC tokens.
    unsubscribeUrl: '%%unsubscribe%%',
    preferencesUrl: '%%manage_preferences%%',
  });

  // OAuth — refresh access token from the long-lived refresh token.
  let accessToken;
  try {
    const tokens = await refreshAccessToken();
    accessToken = tokens.access_token;
  } catch (err) {
    return NextResponse.json({
      error: `Couldn't refresh CC access token: ${err.message}`,
      next: 'The refresh token may have been revoked. Re-run /api/auth/cc-authorize and update CC_REFRESH_TOKEN.',
    }, { status: 502 });
  }

  // Resolve which CC list to send to. Priority:
  //   1. Explicit listId in the request body
  //   2. Per-publication mapping in Firestore (settings/newsletterLists)
  //   3. CC_DEFAULT_LIST_ID env fallback
  //   4. None — draft is created without a list, send-from-CC requires
  //      the editor to pick before sending.
  let resolvedListId = listId || null;
  let listSource = listId ? 'request' : null;
  if (!resolvedListId) {
    try {
      const mapped = await getListIdForPublication(pubId);
      if (mapped) { resolvedListId = mapped; listSource = 'mapping'; }
    } catch { /* mapping read is best-effort */ }
  }
  if (!resolvedListId && process.env.CC_DEFAULT_LIST_ID) {
    resolvedListId = process.env.CC_DEFAULT_LIST_ID;
    listSource = 'env-default';
  }
  const listIds = resolvedListId ? [resolvedListId] : [];

  const niceDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const campaignName = `${publication.name} — ${niceDate}`;
  const subject = stories[0]?.headline?.slice(0, 130) || `${publication.name} ${niceDate}`;
  const preheader = stories[0]?.deck?.slice(0, 140) || '';

  let result;
  try {
    result = await createDraftCampaign({
      accessToken,
      name: campaignName,
      subject,
      preheader,
      html,
      fromName: process.env.CC_FROM_NAME || publication.name,
      fromEmail: process.env.CC_FROM_EMAIL,
      replyToEmail: process.env.CC_REPLY_TO_EMAIL || process.env.CC_FROM_EMAIL,
      listIds,
    });
  } catch (err) {
    return NextResponse.json({ error: `CC campaign create failed: ${err.message}` }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    campaignId: result.campaignId,
    name: result.name,
    listIds,
    listSource,
    listResolved: !!resolvedListId,
    dashboardUrl: `https://app.constantcontact.com/pages/campaigns/email-details/details/activity/${result.activities?.[0]?.campaign_activity_id || result.campaignId}`,
    next: resolvedListId
      ? 'Open Constant Contact, review the draft, and click Send when ready.'
      : `No list mapped for ${publication.name}. Open the draft in CC and pick a list before sending. Or set the mapping at /admin/newsletters/lists.`,
  });
}
