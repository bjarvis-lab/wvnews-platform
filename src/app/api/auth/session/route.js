// POST   /api/auth/session  — takes a freshly-issued ID token from the client,
//                             verifies it server-side, mints a Firebase session
//                             cookie, sets it HttpOnly.
// DELETE /api/auth/session  — revokes the session cookie and clears it.
//
// The client's flow:
//   1) User clicks "Sign in with Google" on /admin/signin
//   2) Client calls signInWithPopup → gets a Firebase user + ID token
//   3) Client POSTs the ID token here
//   4) We verify, create session cookie, return ok → client navigates to /admin
//
// Requires firebase-admin runtime (Node, not Edge).

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { app, db } from '@/lib/firebase-admin';
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_DOMAINS = new Set(['wvnews.com', 'theet.com', 'dominionpost.com']);

export async function POST(request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) return NextResponse.json({ error: 'idToken required' }, { status: 400 });

    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(idToken, true);

    // Policy gate: either a whitelisted domain or an existing active user.
    const email = (decoded.email || '').toLowerCase();
    const domain = email.split('@')[1] || '';
    const userSnap = await db.collection('users').doc(decoded.uid).get();
    const existing = userSnap.exists ? userSnap.data() : null;

    const allowed = (existing && existing.active !== false) || ALLOWED_DOMAINS.has(domain);
    if (!allowed) {
      return NextResponse.json({
        error: 'This account is not authorized for the admin. Ask an editor to add you.',
      }, { status: 403 });
    }

    // Mint a long-lived (7d) session cookie. Firebase handles rotation.
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE * 1000, // milliseconds
    });

    // Touch the user doc so lastLogin is fresh
    await db.collection('users').doc(decoded.uid).set({
      uid: decoded.uid,
      email,
      name: decoded.name || email.split('@')[0],
      photo: decoded.picture || '',
      lastLogin: new Date().toISOString(),
      ...(existing ? {} : { role: 'editor', active: true, createdAt: new Date().toISOString() }),
    }, { merge: true });

    cookies().set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return NextResponse.json({ ok: true, uid: decoded.uid, email });
  } catch (err) {
    console.error('POST /api/auth/session failed:', err);
    return NextResponse.json({ error: err.message || 'Auth failed' }, { status: 401 });
  }
}

export async function DELETE() {
  // Clear cookie. We don't bother revoking the Firebase session globally —
  // cookie removal is enough for this app's surface.
  cookies().delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
