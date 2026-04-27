// Constant Contact API v3 client.
//
// OAuth 2.0 Authorization Code Flow with long-lived refresh tokens.
// Setup is one-time per environment:
//
//   1. CC_API_KEY + CC_APP_SECRET come from your Constant Contact
//      developer app (https://developer.constantcontact.com).
//   2. Visit /api/auth/cc-authorize once while signed in as admin —
//      that route redirects to CC's consent screen, which redirects
//      back to /api/auth/cc-callback with an authorization code.
//   3. The callback exchanges the code for { access_token,
//      refresh_token } and renders the refresh token in the browser.
//      Paste it into Vercel env as CC_REFRESH_TOKEN.
//
// At runtime, every push-to-cc operation refreshes the access token
// (Long Lived refresh tokens don't change, so we don't need to
// persist a rotated value back to env). Access tokens last ~24 hours;
// we mint a fresh one per call rather than caching.
//
// Endpoints:
//   Authorize: https://authz.constantcontact.com/oauth2/default/v1/authorize
//   Token:     https://authz.constantcontact.com/oauth2/default/v1/token
//   API base:  https://api.cc.email/v3

export const CC_OAUTH_AUTHORIZE = 'https://authz.constantcontact.com/oauth2/default/v1/authorize';
export const CC_OAUTH_TOKEN     = 'https://authz.constantcontact.com/oauth2/default/v1/token';
export const CC_API_BASE        = 'https://api.cc.email/v3';

// Scopes — what the developer app is allowed to do on the user's behalf.
// `offline_access` is required to receive a refresh_token.
export const CC_SCOPES = [
  'campaign_data',
  'contact_data',
  'account_read',
  'offline_access',
];

// ───────── Auth helpers ─────────

function basicAuth() {
  const id = process.env.CC_API_KEY;
  const secret = process.env.CC_APP_SECRET;
  if (!id || !secret) throw new Error('CC_API_KEY or CC_APP_SECRET missing.');
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

// Exchange an OAuth authorization code (one-time, from the consent flow)
// for an { access_token, refresh_token } pair. Caller persists the
// refresh_token to env.
export async function exchangeCodeForTokens({ code, redirectUri }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(CC_OAUTH_TOKEN, {
    method: 'POST',
    headers: {
      Authorization: basicAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`CC token exchange failed (${res.status}): ${data.error_description || data.error || JSON.stringify(data)}`);
  return data; // { access_token, refresh_token, token_type, expires_in, ... }
}

// Mint a fresh access_token from a stored refresh_token. Used by every
// push-to-cc call — we don't cache access tokens, just refresh on demand.
export async function refreshAccessToken({ refreshToken } = {}) {
  const rt = refreshToken || process.env.CC_REFRESH_TOKEN;
  if (!rt) throw new Error('CC_REFRESH_TOKEN missing — complete the /api/auth/cc-authorize flow first.');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: rt,
  });
  const res = await fetch(CC_OAUTH_TOKEN, {
    method: 'POST',
    headers: {
      Authorization: basicAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`CC refresh failed (${res.status}): ${data.error_description || data.error || JSON.stringify(data)}`);
  return data; // { access_token, expires_in, token_type, ... }
}

// ───────── API calls ─────────

async function apiFetch(path, { accessToken, ...init } = {}) {
  const res = await fetch(`${CC_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    const msg = Array.isArray(data) ? JSON.stringify(data) : (data.error_message || data.error_key || JSON.stringify(data));
    throw new Error(`CC API ${path} failed (${res.status}): ${msg}`);
  }
  return data;
}

export async function listContactLists({ accessToken }) {
  const data = await apiFetch('/contact_lists?limit=100', { accessToken });
  return data.lists || [];
}

// Create a draft email campaign. CC's v3 model: an "email_campaign" has
// a primary "email_campaign_activity" carrying the actual HTML/subject/
// from. We set status=DRAFT — editors review + send from the CC
// dashboard. Fully-automated send can be added later via:
//   POST /emails/activities/{activity_id}/schedules
//
// Args:
//   name            — internal label (shown in CC dashboard list)
//   subject         — email subject
//   html            — full HTML body (table-based, inline styles)
//   fromName        — display name (e.g. "WV News")
//   fromEmail       — verified sender in CC
//   replyToEmail    — verified reply-to (often same as fromEmail)
//   listIds         — array of contact list ids; can be [] for draft
//   physicalAddress — required by CAN-SPAM; CC stores one per account
//                     so we can fetch it from /account/summary if not
//                     supplied here.
export async function createDraftCampaign({
  accessToken,
  name,
  subject,
  html,
  fromName,
  fromEmail,
  replyToEmail,
  listIds = [],
  preheader = '',
  physicalAddress,
}) {
  // Pull the account's physical address if caller didn't supply one —
  // CC requires it on every campaign for CAN-SPAM compliance.
  let address = physicalAddress;
  if (!address) {
    try {
      const summary = await apiFetch('/account/summary?extra_fields=physical_address', { accessToken });
      address = summary.physical_address;
    } catch { /* will fail below if still missing */ }
  }

  const payload = {
    name,
    email_campaign_activities: [
      {
        format_type: 5, // 5 = HTML email (CC's modern format code)
        from_name: fromName,
        from_email: fromEmail,
        reply_to_email: replyToEmail || fromEmail,
        subject,
        preheader,
        html_content: html,
        contact_list_ids: listIds,
        physical_address_in_footer: address,
      },
    ],
  };

  const data = await apiFetch('/emails', {
    accessToken,
    method: 'POST',
    body: JSON.stringify(payload),
  });
  // CC returns the newly created email_campaign with its activities.
  return {
    campaignId: data.campaign_id || data.id,
    name: data.name,
    activities: data.campaign_activities || data.email_campaign_activities,
    raw: data,
  };
}
