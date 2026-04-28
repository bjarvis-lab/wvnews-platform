// POST /api/layout/upload — multipart upload for layout-builder assets.
//
// Accepts: form data with `file` field (image/*).
// Writes:  Firebase Storage at `layout-assets/{site}/{yyyy-mm}/{ts}_{name}`.
// Returns: { url } a long-lived public-ish URL the editor pastes into a
//          MASTHEAD module config.
//
// Auth: admin session + `layout` permission. 25 MB cap (mastheads
// shouldn't be huge).

import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_PREFIX = 'image/';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(user.profile, 'layout')) {
    return NextResponse.json({ error: 'Layout-builder permission required.' }, { status: 403 });
  }

  let form;
  try {
    form = await request.formData();
  } catch (err) {
    return NextResponse.json({ error: `Invalid form: ${err.message}` }, { status: 400 });
  }
  const file = form.get('file');
  const site = (form.get('site') || 'wvnews').toString().replace(/[^a-z0-9_-]/gi, '');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file attached.' }, { status: 400 });
  }
  if (!file.type || !file.type.startsWith(ALLOWED_PREFIX)) {
    return NextResponse.json({ error: `Only images allowed (got ${file.type || 'unknown'}).` }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({
      error: `File too large (${Math.round(file.size / 1024 / 1024)} MB, max ${MAX_BYTES / 1024 / 1024} MB).`,
    }, { status: 413 });
  }

  const safeName = (file.name || 'asset').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  const yyyymm = new Date().toISOString().slice(0, 7);
  const objectPath = `layout-assets/${site}/${yyyymm}/${Date.now()}_${safeName}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = storage.bucket();
    const storageFile = bucket.file(objectPath);
    await storageFile.save(buffer, {
      contentType: file.type,
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    });
    await storageFile.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
    return NextResponse.json({ ok: true, url, path: objectPath, size: file.size });
  } catch (err) {
    return NextResponse.json({ error: `Upload failed: ${err.message}` }, { status: 500 });
  }
}
