// /api/subscribers
//
//   POST  — create or merge a subscriber from either side (print or digital).
//   GET   — list subscribers (admin only). Supports ?bundleType filter.
//
// See lib/api-auth.js for the three accepted auth styles.
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
import {
  upsertPrintSubscriber,
  upsertDigitalSubscriber,
  listSubscribers,
} from '@/lib/subscribers-db';
import { authorize, withCors, preflight } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(request) { return preflight(request); }

export async function POST(request) {
  const auth = await authorize(request, 'subscribers');
  if (!auth) return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request);

  let body;
  try {
    body = await request.json();
  } catch {
    return withCors(NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }), request);
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
        source: body.source || (auth.kind === 'internal' ? 'printmanager' : auth.kind === 'bearer' ? 'printmanager' : 'admin'),
        tags: body.tags,
      });
      const shouldSendClaim = !!body.email && sub.digital && !sub.digital.hasClaimed && !sub.digital.claimEmailSentAt;
      return withCors(NextResponse.json({ subscriber: sub, shouldSendClaim }), request);
    }
    if (kind === 'digital') {
      const sub = await upsertDigitalSubscriber({
        email: body.email,
        name: body.name,
        phone: body.phone,
        digital: body.digital,
        tags: body.tags,
      });
      return withCors(NextResponse.json({ subscriber: sub }), request);
    }
    return withCors(NextResponse.json({ error: `Unknown kind: ${kind}` }, { status: 400 }), request);
  } catch (err) {
    return withCors(NextResponse.json({ error: err.message }, { status: 400 }), request);
  }
}

export async function GET(request) {
  const auth = await authorize(request, 'subscribers');
  if (!auth) return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request);

  const { searchParams } = new URL(request.url);
  const bundleType = searchParams.get('bundleType') || undefined;
  const limit = Math.min(Number(searchParams.get('limit') || 100), 500);

  const rows = await listSubscribers({ bundleType, limit });
  return withCors(NextResponse.json({ subscribers: rows }), request);
}
