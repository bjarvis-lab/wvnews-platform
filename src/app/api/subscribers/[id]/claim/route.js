// POST /api/subscribers/{id}/claim
//
// Finalizes a subscriber's digital claim. Called from the /claim page
// after signInWithEmailLink resolves on the client. Body:
//   { idToken: string }
//
// We verify the idToken matches the email on the subscriber doc, then:
//   - stamp firebaseUid + digital.hasClaimed = true
//   - create a session cookie so they're signed into the site
//
// This is a public endpoint (no auth header required) — the auth IS
// proving you can sign into the email on the subscriber doc.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/lib/firebase-admin';
import { getSubscriberById, markSubscriberClaimed } from '@/lib/subscribers-db';
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth-server.constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { idToken } = body;
  if (!idToken) return NextResponse.json({ error: 'idToken required' }, { status: 400 });

  let decoded;
  try {
    decoded = await getAuth(app).verifyIdToken(idToken, true);
  } catch (err) {
    return NextResponse.json({ error: `Invalid idToken: ${err.message}` }, { status: 401 });
  }

  const sub = await getSubscriberById(params.id);
  if (!sub) return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });

  const tokenEmail = (decoded.email || '').toLowerCase();
  const subEmail = (sub.email || '').toLowerCase();
  if (!tokenEmail || tokenEmail !== subEmail) {
    return NextResponse.json({ error: 'Token email does not match subscriber on file' }, { status: 403 });
  }

  await markSubscriberClaimed(sub.id, decoded.uid);

  // Mint a session cookie so the reader is signed into wvnews.com afterwards.
  const sessionCookie = await getAuth(app).createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE * 1000,
  });
  cookies().set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return NextResponse.json({ ok: true, subscriberId: sub.id });
}
