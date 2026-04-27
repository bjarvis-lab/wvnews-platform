// POST /api/newsletters/push-to-cc
//
// STUBBED — Constant Contact integration. Body shape will be:
//   { publication, hoursBack, storyCount, adCount, listId, sendAt? }
//
// When wired, this will:
//   1. Render the newsletter HTML (same code path as preview)
//   2. POST it to Constant Contact API v3 as an email_campaign
//   3. Either schedule a send (sendAt) or trigger immediate send
//
// Required env (not yet set):
//   CC_API_KEY            — from your Constant Contact developer app
//   CC_APP_SECRET         — from your developer app
//   CC_REFRESH_TOKEN      — minted via OAuth dance (one-time)
//   CC_DEFAULT_LIST_ID    — fallback contact list if `listId` not in body
//   CC_FROM_NAME          — display name (e.g. "WV News")
//   CC_FROM_EMAIL         — must be verified in Constant Contact
//   CC_REPLY_TO_EMAIL     — verified reply-to address
//
// Setup steps (do these once when you have CC dev access):
//   1. https://developer.constantcontact.com → create app
//   2. Set redirect URI: https://wvnews-platform-lgg2.vercel.app/api/auth/cc-callback
//   3. Copy API Key + App Secret into Vercel env
//   4. Visit /api/auth/cc-authorize (server route to be added) — Google
//      OAuth-style consent flow — exchanges code for refresh_token
//   5. CC returns a refresh_token; route stores it in CC_REFRESH_TOKEN
//   6. From now on, push-to-cc swaps refresh_token for fresh access_token
//      on every send

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(user.profile, 'newsletters')) {
    return NextResponse.json({ error: 'Forbidden — newsletters permission required.' }, { status: 403 });
  }

  // Configuration check
  const required = ['CC_API_KEY', 'CC_APP_SECRET', 'CC_REFRESH_TOKEN', 'CC_FROM_EMAIL'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    return NextResponse.json({
      error: 'Constant Contact not configured.',
      missingEnv: missing,
      next: 'See /api/newsletters/push-to-cc/route.js header for the OAuth setup steps.',
    }, { status: 501 });
  }

  // TODO — implement once CC creds are in place. Sketch:
  //   const accessToken = await refreshCCAccessToken();
  //   const html = renderNewsletterHtml({...});
  //   const campaign = await ccCreateCampaign({ html, listId, ... });
  //   if (sendAt) await ccScheduleCampaign(campaign.id, sendAt);
  //   else        await ccSendCampaign(campaign.id);

  return NextResponse.json({
    error: 'Not implemented yet — Constant Contact integration is queued for next session.',
  }, { status: 501 });
}
