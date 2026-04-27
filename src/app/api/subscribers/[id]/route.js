// GET  /api/subscribers/{id} — fetch one subscriber.
// PATCH /api/subscribers/{id} — partial update (admin only).
// DELETE /api/subscribers/{id} — soft-delete (deactivates).
//
// Same auth rules as /api/subscribers (admin session OR internal token).

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import {
  getSubscriberById,
  deactivateSubscriber,
  upsertDigitalSubscriber,
  upsertPrintSubscriber,
} from '@/lib/subscribers-db';
import { hasPermission } from '@/lib/permissions';

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

export async function GET(request, { params }) {
  const auth = await authorize(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sub = await getSubscriberById(params.id);
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ subscriber: sub });
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  await deactivateSubscriber(params.id, { reason: searchParams.get('reason') });
  return NextResponse.json({ ok: true });
}
