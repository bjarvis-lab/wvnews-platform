// POST /api/newsletters/send-test
//
// Body: { publication, hoursBack, storyCount, adCount, to? }
// Returns: { ok, sentTo, messageId? }
//
// Sends the rendered newsletter via Resend to the admin's own email
// (or an explicit `to` address — useful for forwarding a sample to
// editors before pushing to Constant Contact). Real audience sends
// happen via /api/newsletters/push-to-cc once Constant Contact is wired.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';
import { sites } from '@/data/mock';
import {
  selectStoriesForNewsletter,
  selectAdsForNewsletter,
  renderNewsletterHtml,
} from '@/lib/newsletter-builder';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_RECIPIENTS = 5; // safety: send-test isn't for blasts

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(user.profile, 'newsletters')) {
    return NextResponse.json({ error: 'Forbidden — newsletters permission required.' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const {
    publication: pubId = 'wvnews',
    hoursBack = 24,
    storyCount = 8,
    adCount = 2,
    to,
  } = body;

  // Recipient list — defaults to the signed-in user's email. `to` can be
  // a comma-separated list (max MAX_RECIPIENTS).
  const fromUser = user.email || user.profile?.email;
  const recipients = (Array.isArray(to) ? to : (to || fromUser || '').split(','))
    .map(s => String(s || '').trim())
    .filter(Boolean)
    .slice(0, MAX_RECIPIENTS);
  if (!recipients.length) {
    return NextResponse.json({ error: 'No recipients. Sign in first or pass `to`.' }, { status: 400 });
  }

  const publication = sites.find(s => s.id === pubId) || sites[0];

  let stories = [];
  let ads = [];
  try {
    stories = await selectStoriesForNewsletter({ publication: pubId, hoursBack, count: storyCount });
  } catch (err) {
    return NextResponse.json({ error: `Story selection failed: ${err.message}` }, { status: 500 });
  }
  try {
    ads = await selectAdsForNewsletter({ count: adCount, publication: pubId });
  } catch {/* ads optional */}

  if (!stories.length) {
    return NextResponse.json({ error: `No stories found for ${publication.name} in the last ${hoursBack}h.` }, { status: 400 });
  }

  const siteBaseUrl = publication.domain ? `https://${publication.domain}` : (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin);
  const html = renderNewsletterHtml({
    publication,
    stories,
    ads,
    siteBaseUrl,
    // Test sends don't have CC merge tags — point unsubscribe to a noop.
    unsubscribeUrl: `${siteBaseUrl}/unsubscribe`,
    preferencesUrl: `${siteBaseUrl}/account`,
  });

  const niceDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const subject = `[TEST] ${publication.name} — ${niceDate}`;

  try {
    const result = await sendEmail({
      to: recipients,
      subject,
      html,
      tags: { kind: 'newsletter-test', publication: pubId },
    });
    return NextResponse.json({
      ok: true,
      sentTo: recipients,
      messageId: result?.id,
      stories: stories.length,
      ads: ads.length,
    });
  } catch (err) {
    return NextResponse.json({ error: `Email send failed: ${err.message}` }, { status: 502 });
  }
}
