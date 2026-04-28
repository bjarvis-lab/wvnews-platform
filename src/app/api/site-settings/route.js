// /api/site-settings — per-site customization (masthead, featured
// sections, sidebar toggles). Stored at settings/site-{site} in
// Firestore. Loaded by the public homepage on every render so editor
// changes take effect on the next reload.

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  masthead: { imageUrl: '', altText: '', linkUrl: '/', bgColor: '' },
  featuredSections: ['news', 'sports', 'opinion', 'business', 'community'],
  sidebar: {
    showWeather: true,
    showNewsletter: true,
    showMostRead: true,
    showReaderServices: true,
  },
};

function docId(site) {
  return `site-${(site || 'wvnews').replace(/[^a-z0-9_-]/gi, '')}`;
}

export async function GET(request) {
  // Public read — readers' homepage rendering pulls these settings.
  // No auth required for GET.
  const { searchParams } = new URL(request.url);
  const id = docId(searchParams.get('site'));
  const snap = await db.collection('settings').doc(id).get();
  if (!snap.exists) return NextResponse.json({ id, settings: DEFAULT_SETTINGS, exists: false });
  const data = snap.data();
  return NextResponse.json({
    id,
    settings: { ...DEFAULT_SETTINGS, ...data, sidebar: { ...DEFAULT_SETTINGS.sidebar, ...(data.sidebar || {}) } },
    exists: true,
    updatedAt: data.updatedAt || null,
    updatedBy: data.updatedBy || null,
  });
}

export async function PUT(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(user.profile, 'layout')) {
    return NextResponse.json({ error: 'Site customization permission required.' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const { site, settings } = body;
  if (!settings || typeof settings !== 'object') {
    return NextResponse.json({ error: '`settings` object required.' }, { status: 400 });
  }

  const id = docId(site);
  const updatedBy = user.email || user.profile?.email || null;
  const merged = {
    ...DEFAULT_SETTINGS,
    ...settings,
    sidebar: { ...DEFAULT_SETTINGS.sidebar, ...(settings.sidebar || {}) },
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  await db.collection('settings').doc(id).set(merged, { merge: false });
  return NextResponse.json({ ok: true, id });
}
