// POST /api/ads/upload — accepts multipart form data (file + orderId + notes),
// uploads the file to the wvnews-crm Firebase Storage bucket, and updates the
// matching order document in Firestore with the storage URL + completion
// status. Runs on the Node.js runtime (firebase-admin isn't edge-compatible).

import { NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — matches the client-side hint

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    const orderId = form.get('orderId');
    const notes = (form.get('notes') || '').toString();

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file attached' }, { status: 400 });
    }
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `File too large (${Math.round(file.size / 1024 / 1024)}MB, max 25MB)` }, { status: 413 });
    }

    // Sanitize filename — keep extension + strip anything risky.
    const originalName = file.name || 'creative';
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const ts = Date.now();
    const objectPath = `ad-creatives/${orderId}/${ts}_${safeName}`;

    // Stream to Firebase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = storage.bucket();
    const storageFile = bucket.file(objectPath);
    await storageFile.save(buffer, {
      contentType: file.type || 'application/octet-stream',
      resumable: false,
      metadata: {
        metadata: {
          orderId: String(orderId),
          uploadedAt: new Date().toISOString(),
          uploadedVia: 'wvnews-platform/admin/ads',
        },
      },
    });

    // Signed URL good for ~1 year — enough for billing/ops access. In
    // production you'd wire Firestore access rules or signed-uploads UI so this
    // URL is regenerated on demand, but a long-lived URL is fine for now.
    const [signedUrl] = await storageFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });

    // Write back to the order. We match on the `id` field (a number in the
    // CRM's schema), not the Firestore doc id.
    const numericId = Number(orderId);
    const orderRef = isNaN(numericId)
      ? db.collection('orders').doc(String(orderId))
      : db.collection('orders').doc(String(numericId));

    const existing = await orderRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: `Order ${orderId} not found` }, { status: 404 });
    }

    await orderRef.update({
      artworkUrl: signedUrl,
      artworkNotes: notes,
      'print.artworkStatus': 'Complete',
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      storagePath: objectPath,
      url: signedUrl,
    });
  } catch (err) {
    console.error('/api/ads/upload failed:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
