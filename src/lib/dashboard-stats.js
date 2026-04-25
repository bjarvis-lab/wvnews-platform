// Dashboard aggregations — joins GA4 Data API reports with Firestore stories
// to give role-aware views: a reporter sees their own pageviews, an editor
// sees the newsroom-wide rollup, sales sees ad order stats.
//
// Graceful degradation: if GA4 isn't authorized yet, story-side data still
// renders and pageview numbers come back null. The dashboard surfaces a
// "Connect GA4" hint in that case.

import { db } from './firebase-admin';
import { articlePageviews, dailyPageviews, ping as ga4Ping, GA4_DATA_API_LIVE } from './ga4-data';

// Pull all native stories that are published OR drafted by the given author.
// Used both for "their stories" lists and to attribute pageviews back to authors.
async function listStoriesForAuthor(email, { limit = 200 } = {}) {
  if (!email) return [];
  const lower = email.toLowerCase();
  const snap = await db.collection('stories')
    .orderBy('updatedAt', 'desc')
    .limit(500)
    .get();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(s => s.source === 'native' && (s.author?.email || '').toLowerCase() === lower)
    .slice(0, limit);
}

async function listAllNativeStories({ limit = 500 } = {}) {
  const snap = await db.collection('stories')
    .orderBy('updatedAt', 'desc')
    .limit(800)
    .get();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(s => s.source === 'native')
    .slice(0, limit);
}

// Convert Firestore Timestamps to ISO strings so a server component can pass
// the result to a client component.
function strip(v) {
  return JSON.parse(JSON.stringify(v, (_k, x) => (x?.toDate ? x.toDate().toISOString() : x)));
}

// Map article path → pageviews using GA4. Pure pass-through with error
// handling so callers can show partial dashboards when GA4 isn't wired.
async function getArticlePageviewsMap({ startDate = '7daysAgo' } = {}) {
  if (!GA4_DATA_API_LIVE) return null;
  try {
    const rows = await articlePageviews({ startDate });
    const out = {};
    for (const r of rows) {
      // /article/{slug} → slug
      const m = r.path.match(/^\/article\/([^/?#]+)/);
      if (!m) continue;
      out[m[1]] = (out[m[1]] || 0) + r.pageViews;
    }
    return out;
  } catch (err) {
    return { error: err.message };
  }
}

// ─── Reporter dashboard ────────────────────────────────────────────────
export async function reporterDashboard({ email, days = 7 }) {
  const [stories, pvMap] = await Promise.all([
    listStoriesForAuthor(email),
    getArticlePageviewsMap({ startDate: `${days}daysAgo` }),
  ]);

  // Attach pageviews to stories where available
  const withViews = stories.map(s => ({
    ...s,
    recentViews: pvMap && !pvMap.error && s.slug ? (pvMap[s.slug] || 0) : null,
  }));

  const published = withViews.filter(s => s.status === 'published');
  const drafts = withViews.filter(s => s.status === 'draft');
  const totalRecentViews = pvMap && !pvMap.error
    ? withViews.reduce((sum, s) => sum + (s.recentViews || 0), 0)
    : null;

  // Top 5 stories by recent views
  const top = pvMap && !pvMap.error
    ? [...published].sort((a, b) => (b.recentViews || 0) - (a.recentViews || 0)).slice(0, 5)
    : published.slice(0, 5);

  return strip({
    email,
    days,
    totals: {
      published: published.length,
      drafts: drafts.length,
      totalRecentViews,
    },
    topStories: top,
    drafts: drafts.slice(0, 10),
    ga4Ok: !!pvMap && !pvMap.error,
    ga4Error: pvMap?.error || null,
  });
}

// ─── Editor / newsroom-wide dashboard ──────────────────────────────────
export async function editorDashboard({ days = 7 }) {
  const [stories, pvMap, daily] = await Promise.all([
    listAllNativeStories(),
    getArticlePageviewsMap({ startDate: `${days}daysAgo` }),
    GA4_DATA_API_LIVE ? dailyPageviews({ startDate: `${days}daysAgo` }).catch(() => null) : null,
  ]);

  const published = stories.filter(s => s.status === 'published');
  const drafts = stories.filter(s => s.status === 'draft');

  const withViews = stories.map(s => ({
    ...s,
    recentViews: pvMap && !pvMap.error && s.slug ? (pvMap[s.slug] || 0) : null,
  }));

  // Top 10 stories by recent views
  const topStories = pvMap && !pvMap.error
    ? [...withViews.filter(s => s.status === 'published')]
        .sort((a, b) => (b.recentViews || 0) - (a.recentViews || 0))
        .slice(0, 10)
    : published.slice(0, 10);

  // Top reporters by recent views
  const reporterTotals = new Map();
  for (const s of withViews) {
    const name = s.author?.name || 'Staff';
    const email = (s.author?.email || '').toLowerCase();
    const key = email || name;
    const existing = reporterTotals.get(key) || { name, email, views: 0, stories: 0 };
    existing.views += (s.recentViews || 0);
    existing.stories += 1;
    reporterTotals.set(key, existing);
  }
  const topReporters = [...reporterTotals.values()]
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  // Section breakdown
  const sectionTotals = new Map();
  for (const s of withViews) {
    const sec = s.section || 'news';
    const existing = sectionTotals.get(sec) || { section: sec, views: 0, stories: 0 };
    existing.views += (s.recentViews || 0);
    existing.stories += 1;
    sectionTotals.set(sec, existing);
  }
  const sections = [...sectionTotals.values()].sort((a, b) => b.views - a.views);

  return strip({
    days,
    totals: {
      published: published.length,
      drafts: drafts.length,
      totalRecentViews: pvMap && !pvMap.error
        ? withViews.reduce((sum, s) => sum + (s.recentViews || 0), 0)
        : null,
    },
    topStories,
    topReporters,
    sections,
    daily: daily || null,
    ga4Ok: !!pvMap && !pvMap.error,
    ga4Error: pvMap?.error || null,
  });
}

// ─── Sales dashboard (basic — pulls from CRM) ──────────────────────────
export async function salesDashboard() {
  // Re-use the live ad orders we already wire on /admin/ads
  const snap = await db.collection('orders')
    .orderBy('created', 'desc')
    .limit(200)
    .get();

  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const pending = orders.filter(o => {
    const status = o.print?.artworkStatus || '';
    return status && status.toLowerCase() !== 'complete' && !o.artworkUrl;
  });

  // Submission queue (self-serve forms)
  let pendingSubmissions = 0, awaitingPayment = 0;
  try {
    const subSnap = await db.collection('obituaries').where('status', '==', 'Awaiting Payment').limit(200).get();
    awaitingPayment = subSnap.size;
  } catch {}
  try {
    const subSnap = await db.collection('submissions').where('status', '==', 'Pending Review').limit(200).get();
    pendingSubmissions = subSnap.size;
  } catch {}

  return strip({
    orders: { total: orders.length, pendingArtwork: pending.length },
    submissions: { pendingReview: pendingSubmissions, awaitingPayment },
  });
}

// ─── GA4 connectivity check ────────────────────────────────────────────
export async function checkGA4() {
  if (!GA4_DATA_API_LIVE) return { ok: false, reason: 'GA4_PROPERTY_ID not set' };
  try {
    const result = await ga4Ping();
    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
