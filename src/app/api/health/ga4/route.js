// GET /api/health/ga4 — verifies the GA4 Data API can be reached using the
// shared service account, and that the configured property answers a tiny
// report. If 403, the service account hasn't been granted Viewer access on
// the GA4 property yet — message tells the user exactly what to do.

import { NextResponse } from 'next/server';
import { GA4_PROPERTY_ID, GA4_DATA_API_LIVE, ping } from '@/lib/ga4-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const base = {
    envVars: {
      GA4_PROPERTY_ID: GA4_PROPERTY_ID || null,
      GA4_DATA_API_LIVE,
      FIREBASE_SERVICE_ACCOUNT_KEY: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    },
  };

  if (!GA4_DATA_API_LIVE) {
    return NextResponse.json({
      ...base,
      ok: false,
      error: 'GA4_PROPERTY_ID not set in env',
    }, { status: 500 });
  }

  try {
    const result = await ping();
    return NextResponse.json({ ...base, ok: true, ...result });
  } catch (err) {
    const code = err.code || err.status || 500;
    const hint = String(err.message || '').includes('403') || code === 7
      ? `403 Forbidden — the service account isn't authorized on this GA4 property. In GA4 → Admin → Property → Property Access Management, add firebase-adminsdk-fbsvc@wvnews-crm.iam.gserviceaccount.com with the "Viewer" role.`
      : null;
    return NextResponse.json({
      ...base,
      ok: false,
      error: err.message,
      code,
      hint,
    }, { status: 500 });
  }
}
