// /api/subscribers
//
//   POST  — create or merge a subscriber from either side (print or digital).
//   GET   — list subscribers (admin only). Supports ?bundleType filter.
//
// Auth: either
//   (a) a signed-in admin session (used by /admin/subscribers and /subscribe), or
//   (b) the INTERNAL_API_TOKEN header (used by PrintManager + bulk import scripts).
//
// POST body shape:
//   { kind: 'print', email?, name, phone?, address?, print: {...} }
//   { kind: 'digital', email, name, phone?, digital: {...} }
//
// On a successful print upsert WITH email and no prior claim, the response
// includes `shouldSendClaim: true` so the caller can trigger the claim
// email (POST /api/subscribers/{id}/send-claim). We don't fire it
// automatically here so bulk imports can stage emails into a queue
// instead of blasting thousands at once.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import {
  upsertPrintSubscriber,
  upsertDigitalSubscriber,
  listSubscribers,
} from '@/lib/subscribers-db';
import { hasPermission } from '@/lib/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authorize(request, requiredPerm) {
  const headerToken = request.headers.get('x-internal-token');
  const expected = process.env.INTERNAL_API_TOKEN;
  if (expected && headerToken && headerToken === expected) {
    return { kind: 'internal' };
  }
  const user = await getSessionUser();
  if (!user) return null;
  if (requiredPerm && !hasPermission(user.profile, requiredPerm)) return null;
  return { kind: 'session', user };
}

export async function POST(request) {
  const auth = await authorize(request, 'subscribers');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { kind } = body;
  try {
    if (kind === 'print') {
      const sub = await upsertPrintSubscriber({
        email: body.email,
        name: body.name,
        phone: body.phone,
        address: body.address,
        print: body.print,
        source: body.source || (auth.kind === 'internal' ? 'printmanager' : 'admin'),
        tags: body.tags,
      });
      const shouldSendClaim = !!body.email && sub.digital && !sub.digital.hasClaimed && !sub.digital.claimEmailSentAt;
      return NextResponse.json({ subscriber: sub, shouldSendClaim });
    }
    if (kind === 'digital') {
      const sub = await upsertDigitalSubscriber({
        email: body.email,
        name: body.name,
        phone: body.phone,
        digital: body.digital,
        tags: body.tags,
      });
      return NextResponse.json({ subscriber: sub });
    }
    return NextResponse.json({ error: `Unknown kind: ${kind}` }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET(request) {
  const auth = await authorize(request, 'subscribers');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bundleType = searchParams.get('bundleType') || undefined;
  const limit = Math.min(Number(searchParams.get('limit') || 100), 500);

  const rows = await listSubscribers({ bundleType, limit });
  return NextResponse.json({ subscribers: rows });
}
