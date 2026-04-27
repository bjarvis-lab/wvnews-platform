// GET    /api/subscribers/{id} — fetch one subscriber.
// DELETE /api/subscribers/{id} — soft-delete (deactivates).
//
// See lib/api-auth.js for the accepted auth styles.

import { NextResponse } from 'next/server';
import {
  getSubscriberById,
  deactivateSubscriber,
} from '@/lib/subscribers-db';
import { authorize, withCors, preflight } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(request) { return preflight(request); }

export async function GET(request, { params }) {
  const auth = await authorize(request, 'subscribers');
  if (!auth) return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request);
  const sub = await getSubscriberById(params.id);
  if (!sub) return withCors(NextResponse.json({ error: 'Not found' }, { status: 404 }), request);
  return withCors(NextResponse.json({ subscriber: sub }), request);
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request, 'subscribers');
  if (!auth) return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request);
  const { searchParams } = new URL(request.url);
  await deactivateSubscriber(params.id, { reason: searchParams.get('reason') });
  return withCors(NextResponse.json({ ok: true }), request);
}
