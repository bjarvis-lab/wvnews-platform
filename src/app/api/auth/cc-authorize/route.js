// GET /api/auth/cc-authorize
//
// One-time setup endpoint. Admin signs in to platform, visits this URL,
// gets bounced to Constant Contact's consent screen, approves, and CC
// sends them back to /api/auth/cc-callback with an authorization code.
// The callback exchanges the code for a refresh token and prints it.
//
// This is the entire OAuth dance — once complete, CC_REFRESH_TOKEN goes
// into Vercel env and every subsequent push-to-cc just refreshes the
// access token on demand.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';
import { CC_OAUTH_AUTHORIZE, CC_SCOPES } from '@/lib/cc-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'cc_oauth_state';

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in to /admin first.' }, { status: 401 });
  if (!hasPermission(user.profile, 'newsletters')) {
    return NextResponse.json({ error: 'Newsletters permission required.' }, { status: 403 });
  }

  const apiKey = process.env.CC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'CC_API_KEY not set on this environment.' }, { status: 501 });
  }

  // Generate a random state token, set it in an HTTP-only cookie, and
  // include it in the OAuth redirect. Callback verifies the cookie
  // matches the query param to prevent CSRF.
  const state = randomBytes(24).toString('hex');
  cookies().set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/cc-callback`;

  const url = new URL(CC_OAUTH_AUTHORIZE);
  url.searchParams.set('client_id', apiKey);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', CC_SCOPES.join('+').replace(/\+/g, ' ')); // CC accepts space or + separated
  url.searchParams.set('state', state);

  return NextResponse.redirect(url.toString());
}
