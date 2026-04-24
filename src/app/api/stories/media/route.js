// POST /api/stories/media — uploads an image or video from the editor to
// Firebase Storage and returns a long-lived public-ish URL for embedding.
//
// Gated behind requireAdmin() so only signed-in staff can write to the bucket.
// Files land under story-media/{yyyy-mm}/{timestamp}_{sanitized-name}.

import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 25 MB for images, 200 MB for video. Over that: nudge them to YouTube.
const LIMITS = {
  image: 25 * 1024 * 1024,
  video: 200 * 1024 * 1024,
};

function kindOf(mime) {
  if (!mime) return null;
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return null;
}

export async function POST(request) {
  try {
    await requireAdmin();

    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file attached' }, { status: 400 });
    }

    const kind = kindOf(file.type);
    if (!kind) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    }
    if (file.size > LIMITS[kind]) {
      const mb = Math.round(file.size / 1024 / 1024);
      const suggest = kind === 'video'
        ? ' Consider uploading to YouTube and pasting the URL into the editor instead.'
        : '';
      return NextResponse.json({
        error: `File too large (${mb} MB, max ${LIMITS[kind] / 1024 / 1024} MB).${suggest}`,
      }, { status: 413 });
    }

    const safeName = (file.name || 'media').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const yyyymm = new Date().toISOString().slice(0, 7); // 2026-04
    const objectPath = `story-media/${yyyymm}/${Date.now()}_${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = storage.bucket();
    const storageFile = bucket.file(objectPath);
    await storageFile.save(buffer, {
      contentType: file.type,
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: {
          uploadedAt: new Date().toISOString(),
          uploadedVia: 'wvnews-platform/admin/stories',
          kind,
        },
      },
    });

    // Public-style signed URL — effectively permanent. When the CMS gets
    // proper media management we'll centralize this in a media-library
    // helper, but for now long-expiry signed URLs are enough.
    const [url] = await storageFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
    });

    return NextResponse.json({
      ok: true,
      kind,
      url,
      storagePath: objectPath,
      name: file.name,
      size: file.size,
      contentType: file.type,
    });
  } catch (err) {
    if (err?.digest === 'NEXT_REDIRECT') throw err; // let requireAdmin redirect bubble
    console.error('/api/stories/media failed:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
