// GET  /api/newsletters/lists      → current mapping (publication id → CC list id)
// PUT  /api/newsletters/lists      → save full mapping (admin only)
//
// Single Firestore doc (settings/newsletterLists). The composer reads
// it on each preview/push to route the newsletter to the right list.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';
import {
  getNewsletterListMapping,
  saveNewsletterListMapping,
} from '@/lib/newsletter-lists-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(user.profile, 'newsletters')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const result = await getNewsletterListMapping();
  return NextResponse.json(result);
}

export async function PUT(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(user.profile, 'newsletters')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  let body;
  try { body = await request.json(); } catch { body = {}; }
  const { mapping } = body;
  if (!mapping || typeof mapping !== 'object') {
    return NextResponse.json({ error: 'Body must include `mapping` object.' }, { status: 400 });
  }
  const updatedBy = user.email || user.profile?.email || null;
  const saved = await saveNewsletterListMapping(mapping, updatedBy);
  return NextResponse.json({ ok: true, ...saved });
}
