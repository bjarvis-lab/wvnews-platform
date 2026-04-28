// GET /api/admin/blox/test
//
// Diagnostic endpoint — exercises the BLOX client against the live API
// so you can verify the credentials + auth signature are correct
// without having to run the full ingest. Returns counts + a sample
// asset, or a clear error if BLOX rejected the request.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';
import { searchEditorial, bloxAssetToStory } from '@/lib/blox-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in to /admin first.' }, { status: 401 });
  if (!hasPermission(user.profile, 'import')) {
    return NextResponse.json({ error: 'Import permission required.' }, { status: 403 });
  }

  const required = ['BLOX_API_BASE', 'BLOX_API_KEY', 'BLOX_API_SECRET'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    return NextResponse.json({ error: 'BLOX env not configured.', missingEnv: missing }, { status: 501 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') || 5), 50);

  let assets;
  try {
    assets = await searchEditorial({ t: 'article', l: limit });
  } catch (err) {
    return NextResponse.json({
      error: err.message,
      status: err.status || null,
      url: err.url || null,
      bodySnippet: typeof err.body === 'string' ? err.body.slice(0, 600) : null,
      hint: err.status === 401
        ? 'Auth rejected — your install may use a different auth scheme. Check the Authorization header style with TownNews support.'
        : err.status === 404
          ? 'Endpoint path may differ on your install. Confirm /tncms/webservice/v1/editorial/search exists.'
          : null,
    }, { status: 502 });
  }

  // Show a tiny normalized sample so we can confirm field names.
  const samples = (assets || []).slice(0, 3).map(a => {
    const story = bloxAssetToStory(a);
    return {
      title: story.headline,
      section: story.section,
      publishedAt: story.publishedAt,
      hasImage: !!story.image?.url,
      hasBody: !!story.body && story.body.length > 100,
      bodyChars: (story.body || '').length,
      sourceUrl: story.sourceUrl,
    };
  });

  return NextResponse.json({
    ok: true,
    count: assets?.length || 0,
    samples,
    rawSample: assets?.[0] ? { keys: Object.keys(assets[0]).slice(0, 30) } : null,
  });
}
