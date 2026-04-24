// GET /api/health/firebase — safe diagnostic endpoint. Reports whether the
// Firebase Admin SDK can init and read one doc. Never leaks the key material —
// only the key's fingerprint (project_id + first 8 chars of private_key_id).
//
// Used for debugging Vercel env-var misconfiguration. Safe to leave in place;
// it requires no auth but exposes no sensitive data.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const result = {
    envVarsSeen: {
      FIREBASE_SERVICE_ACCOUNT_KEY: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      FIREBASE_SERVICE_ACCOUNT_KEY_length: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || null,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || null,
      GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    },
  };

  // Try to parse the service account without initializing Firebase
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    try {
      let s = raw.trim();
      if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1);
      const obj = JSON.parse(s);
      result.keyFingerprint = {
        project_id: obj.project_id,
        client_email: obj.client_email,
        private_key_id_prefix: obj.private_key_id?.slice(0, 8) || null,
        has_literal_backslash_n_in_private_key:
          obj.private_key?.includes('\\n') && !obj.private_key?.includes('\n'),
        private_key_starts_correctly: obj.private_key?.startsWith('-----BEGIN PRIVATE KEY-----'),
      };
    } catch (e) {
      result.keyParseError = e.message;
    }
  }

  // Now try the real Firebase init + one read
  try {
    const { db } = await import('@/lib/firebase-admin');
    const snap = await db.collection('advertisers').limit(1).get();
    result.firestoreRead = { ok: true, docsReturned: snap.size };
  } catch (e) {
    result.firestoreRead = { ok: false, error: e.message, code: e.code || null };
  }

  return NextResponse.json(result, { status: result.firestoreRead?.ok ? 200 : 500 });
}
