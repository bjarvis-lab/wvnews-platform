// GET /api/newsletters/campaigns
//
// Pulls recent email campaigns from Constant Contact and joins each
// with its activity-level stats (sends, opens, unique opens, clicks,
// unique clicks, bounces, unsubscribes). Used by the dashboard to show
// editor-facing performance.
//
// Optional query: ?limit=50 (max 200).

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { hasPermission } from '@/lib/permissions';
import {
  refreshAccessToken,
  listEmailCampaigns,
  getCampaignActivityStatsBulk,
} from '@/lib/cc-client';

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

  const limit = Math.min(Number(new URL(request.url).searchParams.get('limit') || 50), 200);

  let campaigns = [];
  let stats = [];
  try {
    const tokens = await refreshAccessToken();
    campaigns = await listEmailCampaigns({ accessToken: tokens.access_token, limit });

    // Pull primary activity ids — only "primary_email" activities have
    // recipients/stats; other roles (resend, ab_test_b) are followups.
    const activityIds = [];
    for (const c of campaigns) {
      const primary = (c.campaign_activities || []).find(a => a.role === 'primary_email');
      if (primary?.campaign_activity_id) activityIds.push(primary.campaign_activity_id);
    }
    if (activityIds.length) {
      stats = await getCampaignActivityStatsBulk({
        accessToken: tokens.access_token,
        campaignActivityIds: activityIds,
      });
    }
  } catch (err) {
    return NextResponse.json({ error: `CC fetch failed: ${err.message}` }, { status: 502 });
  }

  // Index stats by activity id for fast join.
  const statsByActivity = new Map();
  for (const s of stats) {
    if (s.campaign_activity_id) statsByActivity.set(s.campaign_activity_id, s);
  }

  // Build display rows.
  const rows = campaigns.map(c => {
    const primary = (c.campaign_activities || []).find(a => a.role === 'primary_email');
    const activityId = primary?.campaign_activity_id || null;
    const s = activityId ? statsByActivity.get(activityId) : null;
    const counts = s?.unique_counts || {};
    const sends = counts.sends ?? counts.deliveries ?? 0;
    const opens = counts.opens ?? 0;
    const clicks = counts.clicks ?? 0;
    return {
      campaignId: c.campaign_id || c.id,
      activityId,
      name: c.name,
      status: c.current_status || c.last_sent_date ? 'sent' : c.current_status,
      lastSentAt: c.last_sent_date || null,
      createdAt: c.created_at || null,
      updatedAt: c.updated_at || null,
      stats: s ? {
        sends,
        opens,
        uniqueOpens: counts.unique_opens ?? opens,
        openRate: sends > 0 ? opens / sends : 0,
        clicks,
        uniqueClicks: counts.unique_clicks ?? clicks,
        clickRate: sends > 0 ? clicks / sends : 0,
        bounces: counts.bounces ?? 0,
        unsubscribes: counts.optouts ?? counts.unsubscribes ?? 0,
        forwards: counts.forwards ?? 0,
      } : null,
      raw: { campaignActivityId: activityId },
    };
  });

  return NextResponse.json({ campaigns: rows });
}
