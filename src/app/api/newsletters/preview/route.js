// POST /api/newsletters/preview
//
// Body: { publication, hoursBack, storyCount, adCount }
// Returns: { html, stories, ads, generatedAt }
//
// Used by /admin/newsletters to render the composer preview pane. No
// emails are sent. Auth required (any signed-in admin with the
// `newsletters` permission can preview).

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';
import { sites } from '@/data/mock';
import {
  selectStoriesForNewsletter,
  selectAdsForNewsletter,
  renderNewsletterHtml,
} from '@/lib/newsletter-builder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  } = body;

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
  } catch (err) {
    // Ads are optional; missing ad source shouldn't block the preview.
    console.warn('[newsletters/preview] ad selection failed:', err.message);
  }

  const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const html = renderNewsletterHtml({
    publication,
    stories,
    ads,
    siteBaseUrl: publication.domain ? `https://${publication.domain}` : siteBaseUrl,
  });

  return NextResponse.json({
    html,
    stories,
    ads,
    publication,
    generatedAt: new Date().toISOString(),
  });
}
