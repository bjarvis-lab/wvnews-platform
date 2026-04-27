// POST /api/subscribers/{id}/send-claim
//
// Triggers the welcome email that lets a print subscriber claim their
// digital access. Generates a Firebase Auth passwordless sign-in link
// for the subscriber's email, embeds it in the email, and stamps
// digital.claimEmailSentAt so we don't blast on reload.
//
// Idempotent-ish: if claimEmailSentAt is set within the last hour we
// short-circuit unless ?force=1 is passed. Caller can force a resend
// from /admin/subscribers when staff wants to manually trigger again.

import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';
import { getSubscriberById, markClaimEmailSent } from '@/lib/subscribers-db';
import { sendEmail, buildClaimEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authorize(request) {
  const headerToken = request.headers.get('x-internal-token');
  const expected = process.env.INTERNAL_API_TOKEN;
  if (expected && headerToken && headerToken === expected) {
    return { kind: 'internal' };
  }
  const user = await getSessionUser();
  if (!user) return null;
  if (!hasPermission(user.profile, 'subscribers')) return null;
  return { kind: 'session', user };
}

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function POST(request, { params }) {
  const auth = await authorize(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === '1';

  const sub = await getSubscriberById(params.id);
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!sub.email) return NextResponse.json({ error: 'Subscriber has no email on file' }, { status: 400 });
  if (sub.digital?.hasClaimed) return NextResponse.json({ error: 'Already claimed' }, { status: 400 });

  if (!force && sub.digital?.claimEmailSentAt) {
    const sentAt = new Date(sub.digital.claimEmailSentAt).getTime();
    if (Date.now() - sentAt < ONE_HOUR_MS) {
      return NextResponse.json({
        error: 'Claim email was sent recently. Pass ?force=1 to resend.',
        lastSentAt: sub.digital.claimEmailSentAt,
      }, { status: 429 });
    }
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  // Email is included in continueUrl so the /claim page can call
  // signInWithEmailLink without prompting for it. The oobCode in the
  // Firebase URL is what actually authorizes — exposing the email here
  // is only the recipient's own address and gets cleared once consumed.
  const continueUrl = `${origin}/claim?subscriberId=${encodeURIComponent(sub.id)}&email=${encodeURIComponent(sub.email)}`;

  // Generate a Firebase Auth passwordless link. The link will land at
  // continueUrl after Firebase verifies the email; client-side code on
  // /claim completes signInWithEmailLink and finalizes the claim.
  let signInLink;
  try {
    signInLink = await getAuth(app).generateSignInWithEmailLink(sub.email, {
      url: continueUrl,
      handleCodeInApp: true,
    });
  } catch (err) {
    return NextResponse.json({ error: `Failed to generate sign-in link: ${err.message}` }, { status: 500 });
  }

  const { subject, html, text } = buildClaimEmail({
    name: sub.name,
    claimUrl: signInLink,
    edition: sub.print?.edition,
  });

  try {
    await sendEmail({
      to: sub.email,
      subject,
      html,
      text,
      tags: { kind: 'subscriber-claim', subscriberId: sub.id },
    });
  } catch (err) {
    return NextResponse.json({ error: `Email send failed: ${err.message}` }, { status: 502 });
  }

  await markClaimEmailSent(sub.id);
  return NextResponse.json({ ok: true });
}
