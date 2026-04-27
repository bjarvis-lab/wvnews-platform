// /api/subscribe — public, anonymous endpoint for reader-side signup.
//
// Used by the /subscribe page when a visitor enters their email for the
// free Registered tier. We:
//   1. Upsert a digital subscriber doc (source: 'platform-signup')
//   2. Mint a Firebase passwordless sign-in link
//   3. Email it via Resend
// The reader clicks the link, lands on /claim, signs in, and we stamp
// firebaseUid + hasClaimed = true on the subscriber doc.
//
// Paid tiers (all-access, print+digital, e-edition-only) need Stripe
// Checkout — those return 501 Not Implemented for now.
//
// This endpoint is intentionally public. To prevent abuse:
//   - Light rate limit by email (Resend's send-claim cooldown is 1 hour)
//   - Only the email's owner can complete the flow (Firebase verifies
//     the link before we issue a session cookie on /claim)

import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/lib/firebase-admin';
import { upsertDigitalSubscriber, markClaimEmailSent } from '@/lib/subscribers-db';
import { sendEmail, buildClaimEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FREE_PLAN = 'registered';
const PAID_PLANS = new Set(['all-access', 'print-digital', 'e-edition-only']);

function isValidEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 200;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { email, name, plan = FREE_PLAN } = body;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (PAID_PLANS.has(plan)) {
    return NextResponse.json({
      error: 'Paid plans aren\'t live yet — we\'re wiring up Stripe. Sign up for the free tier to be notified when paid plans launch.',
    }, { status: 501 });
  }
  if (plan !== FREE_PLAN) {
    return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
  }

  // Upsert digital subscriber. If they're already on file, this just
  // refreshes name + tags and we move on to claim email.
  let sub;
  try {
    sub = await upsertDigitalSubscriber({
      email,
      name: name || '',
      digital: { source: 'paid-digital', plan: 'registered' },
      tags: ['reader-signup'],
    });
  } catch (err) {
    return NextResponse.json({ error: `Could not save subscriber: ${err.message}` }, { status: 500 });
  }

  // If they've already claimed, we don't need to send another link.
  if (sub.digital?.hasClaimed) {
    return NextResponse.json({
      ok: true,
      alreadyClaimed: true,
      message: "You're already signed up! Sign in at wvnews.com to access your account.",
    });
  }

  // Generate the magic link.
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const continueUrl = `${origin}/claim?subscriberId=${encodeURIComponent(sub.id)}&email=${encodeURIComponent(email)}`;

  let signInLink;
  try {
    signInLink = await getAuth(app).generateSignInWithEmailLink(email, {
      url: continueUrl,
      handleCodeInApp: true,
    });
  } catch (err) {
    return NextResponse.json({ error: `Could not generate sign-in link: ${err.message}` }, { status: 500 });
  }

  const { subject, html, text } = buildClaimEmail({
    name: name || sub.name,
    claimUrl: signInLink,
    edition: null,
  });

  try {
    await sendEmail({
      to: email,
      subject,
      html,
      text,
      tags: { kind: 'reader-signup', subscriberId: sub.id },
    });
  } catch (err) {
    return NextResponse.json({ error: `Email send failed: ${err.message}` }, { status: 502 });
  }

  await markClaimEmailSent(sub.id);
  return NextResponse.json({
    ok: true,
    message: `Check your inbox — we sent a sign-in link to ${email}.`,
  });
}
