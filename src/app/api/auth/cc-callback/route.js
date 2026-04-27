// GET /api/auth/cc-callback
//
// Constant Contact redirects here after the consent screen with
// `?code=...&state=...`. We:
//   1. Verify the state matches our cookie (CSRF guard)
//   2. Exchange the code for { access_token, refresh_token }
//   3. Render a one-page result with the refresh token (and a copy
//      button) so the admin can paste it into Vercel env as
//      CC_REFRESH_TOKEN
//
// The refresh token is rendered IN THE RESPONSE BODY, not stored on
// our server — we don't have a place to put it that survives serverless
// restarts, and Vercel env is the right home anyway.

import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';
import { exchangeCodeForTokens } from '@/lib/cc-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'cc_oauth_state';

function htmlPage(body) {
  return new Response(`<!doctype html>
<html><head><title>Constant Contact OAuth</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 720px; margin: 48px auto; padding: 0 20px; line-height: 1.55; color: #222; }
  h1 { font-size: 22px; color: #0e2a47; }
  code, pre { font-family: ui-monospace, Menlo, Monaco, monospace; }
  pre { background: #f4f4f6; padding: 14px 16px; border-radius: 6px; overflow-x: auto; font-size: 13px; word-break: break-all; white-space: pre-wrap; }
  .ok { color: #1f7a3a; }
  .err { color: #991b1b; background: #fef2f2; padding: 14px; border-radius: 6px; }
  .step { background: #fbfbfd; border: 1px solid #e3e5ea; padding: 16px 18px; border-radius: 6px; margin: 12px 0; }
  button { padding: 8px 14px; font-size: 13px; background: #0e2a47; color: white; border: 0; border-radius: 4px; cursor: pointer; }
  button:hover { background: #1a3a5f; }
</style></head><body>${body}</body></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return htmlPage(`<h1>Sign in required</h1><p>Sign in at <a href="/admin">/admin</a> first, then re-run /api/auth/cc-authorize.</p>`);
  if (!hasPermission(user.profile, 'newsletters')) {
    return htmlPage(`<h1>Permission denied</h1><p>Your role doesn't include newsletter permissions.</p>`);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDesc = url.searchParams.get('error_description');

  if (error) {
    return htmlPage(`<h1 class="err">Constant Contact denied the request</h1>
      <p><strong>${error}</strong> — ${errorDesc || 'No description'}</p>
      <p>If this was an accident, <a href="/api/auth/cc-authorize">try again</a>.</p>`);
  }

  // Verify state to prevent CSRF
  const expectedState = cookies().get(STATE_COOKIE)?.value;
  cookies().delete(STATE_COOKIE);
  if (!state || !expectedState || state !== expectedState) {
    return htmlPage(`<h1 class="err">State mismatch</h1>
      <p>The OAuth state didn't match the cookie. Start over: <a href="/api/auth/cc-authorize">/api/auth/cc-authorize</a>.</p>`);
  }

  if (!code) {
    return htmlPage(`<h1 class="err">No authorization code returned</h1><p><a href="/api/auth/cc-authorize">Try again</a>.</p>`);
  }

  // Exchange code for tokens
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/cc-callback`;
  let tokens;
  try {
    tokens = await exchangeCodeForTokens({ code, redirectUri });
  } catch (err) {
    return htmlPage(`<h1 class="err">Token exchange failed</h1>
      <p>${err.message}</p>
      <p>Common causes: API Key/Secret mismatch in env, redirect URI not registered with the CC app, or the code already expired (codes are single-use).</p>
      <p><a href="/api/auth/cc-authorize">Try again</a>.</p>`);
  }

  return htmlPage(`
    <h1 class="ok">Constant Contact connected ✓</h1>
    <p>Now save the refresh token to Vercel so the platform can mint fresh access tokens for every newsletter push.</p>

    <div class="step">
      <strong>Step 1.</strong> Copy the refresh token below.
      <pre id="rt">${escape(tokens.refresh_token || '(missing — re-authorize)')}</pre>
      <button onclick="navigator.clipboard.writeText(document.getElementById('rt').innerText).then(()=>this.textContent='Copied ✓')">Copy refresh token</button>
    </div>

    <div class="step">
      <strong>Step 2.</strong> Paste it into Vercel as <code>CC_REFRESH_TOKEN</code>.
      <ul>
        <li>https://vercel.com/dashboard → wvnews-platform → Settings → Environment Variables</li>
        <li>Add new: <code>CC_REFRESH_TOKEN</code> with the value above</li>
        <li>Environments: Production + Preview</li>
        <li>Save</li>
      </ul>
    </div>

    <div class="step">
      <strong>Step 3.</strong> Set the sender identity (also Vercel env).
      <ul>
        <li><code>CC_FROM_EMAIL</code> — must be a verified sender in CC (e.g. <code>newsroom@wvnews.com</code>)</li>
        <li><code>CC_FROM_NAME</code> — display name (e.g. <code>WV News</code>)</li>
        <li><code>CC_DEFAULT_LIST_ID</code> — optional; the contact list to send to by default</li>
      </ul>
    </div>

    <div class="step">
      <strong>Step 4.</strong> Trigger a redeploy (Vercel → Deployments → latest → ⋯ → Redeploy without build cache).
    </div>

    <p>Once redeployed, the Push to Constant Contact button on <a href="/admin/newsletters">/admin/newsletters</a> creates draft campaigns in your CC dashboard.</p>

    <hr style="margin-top:32px;border:none;border-top:1px solid #eee;">
    <details style="margin-top:16px;">
      <summary style="cursor:pointer;font-size:13px;color:#666;">Debug — full token response (don't share)</summary>
      <pre>${escape(JSON.stringify(tokens, null, 2))}</pre>
    </details>
  `);
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
