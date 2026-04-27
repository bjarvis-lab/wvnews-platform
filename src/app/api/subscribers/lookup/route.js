// GET /api/subscribers/lookup?email=foo@bar.com
// GET /api/subscribers/lookup?printManagerId=12345
//
// Used by:
//   - Bulk import scripts to dedup before writing
//   - PrintManager when adding a subscriber, to detect "already on file"
//   - The claim flow to validate a token's email against the on-file record

import { NextResponse } from 'next/server';
import { findSubscriberByEmail, findSubscriberByPrintManagerId } from '@/lib/subscribers-db';
import { authorize, withCors, preflight } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(request) { return preflight(request); }

export async function GET(request) {
  const auth = await authorize(request, 'subscribers');
  if (!auth) return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request);

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const printManagerId = searchParams.get('printManagerId');

  if (!email && !printManagerId) {
    return withCors(NextResponse.json({ error: 'email or printManagerId required' }, { status: 400 }), request);
  }

  const sub = email
    ? await findSubscriberByEmail(email)
    : await findSubscriberByPrintManagerId(printManagerId);

  return withCors(NextResponse.json({ subscriber: sub }), request);
}
