// GET /api/subscribers/lookup?email=foo@bar.com
// GET /api/subscribers/lookup?printManagerId=12345
//
// Used by:
//   - Bulk import scripts to dedup before writing
//   - PrintManager when adding a subscriber, to detect "already has digital"
//   - The claim flow to validate a token's email against the on-file record
//
// Requires admin session or INTERNAL_API_TOKEN.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { findSubscriberByEmail, findSubscriberByPrintManagerId } from '@/lib/subscribers-db';
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

export async function GET(request) {
  const auth = await authorize(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const printManagerId = searchParams.get('printManagerId');

  if (!email && !printManagerId) {
    return NextResponse.json({ error: 'email or printManagerId required' }, { status: 400 });
  }

  const sub = email
    ? await findSubscriberByEmail(email)
    : await findSubscriberByPrintManagerId(printManagerId);

  return NextResponse.json({ subscriber: sub });
}
