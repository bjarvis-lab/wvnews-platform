// GET /api/newsletters/cc-lists
//
// Pulls the live contact list inventory from Constant Contact so the
// settings UI can show actual list names + ids when assigning each
// publication. Refreshes the access token from CC_REFRESH_TOKEN.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';
import { refreshAccessToken, listContactLists } from '@/lib/cc-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(user.profile, 'newsletters')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!process.env.CC_REFRESH_TOKEN) {
    return NextResponse.json({
      error: 'Constant Contact not authorized yet — visit /api/auth/cc-authorize first.',
    }, { status: 501 });
  }

  let lists;
  try {
    const tokens = await refreshAccessToken();
    lists = await listContactLists({ accessToken: tokens.access_token });
  } catch (err) {
    return NextResponse.json({ error: `CC fetch failed: ${err.message}` }, { status: 502 });
  }

  // Slim payload — just what the UI needs.
  return NextResponse.json({
    lists: lists.map(l => ({
      list_id: l.list_id,
      name: l.name,
      description: l.description || '',
      membership_count: l.membership_count ?? null,
      created_at: l.created_at,
      updated_at: l.updated_at,
    })),
  });
}
