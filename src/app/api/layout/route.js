// /api/layout — load + save the public-page layout JSON for a given
// site + template. Stored as a single Firestore doc per (site, template)
// combo, e.g. layouts/wvnews-homepage. Editors save through the layout
// builder; the public site reads on render to drive what shows up.

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function docId(site, template) {
  return `${(site || 'wvnews').replace(/[^a-z0-9_-]/gi, '')}-${(template || 'homepage').replace(/[^a-z0-9_-]/gi, '')}`;
}

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(user.profile, 'layout')) {
    return NextResponse.json({ error: 'Layout-builder permission required.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = docId(searchParams.get('site'), searchParams.get('template'));
  const snap = await db.collection('layouts').doc(id).get();
  if (!snap.exists) return NextResponse.json({ id, modules: null, exists: false });
  const data = snap.data();
  return NextResponse.json({
    id,
    modules: data.modules || [],
    exists: true,
    updatedAt: data.updatedAt || null,
    updatedBy: data.updatedBy || null,
  });
}

export async function PUT(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(user.profile, 'layout')) {
    return NextResponse.json({ error: 'Layout-builder permission required.' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const { site, template, modules } = body;
  if (!Array.isArray(modules)) {
    return NextResponse.json({ error: '`modules` must be an array.' }, { status: 400 });
  }

  const id = docId(site, template);
  const updatedBy = user.email || user.profile?.email || null;
  await db.collection('layouts').doc(id).set({
    site: site || 'wvnews',
    template: template || 'homepage',
    modules,
    updatedAt: new Date().toISOString(),
    updatedBy,
  }, { merge: false });

  return NextResponse.json({ ok: true, id, count: modules.length });
}
