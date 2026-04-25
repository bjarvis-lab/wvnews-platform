// GA4 Data API client — runs reports against your GA4 property using the
// shared wvnews-crm service account. The same JSON key that talks to
// Firestore + Storage authenticates here too.
//
// One-time GA4 setup needed: in GA4 → Admin → Property → Property Access
// Management → add the service account email
// `firebase-adminsdk-fbsvc@wvnews-crm.iam.gserviceaccount.com` with the
// `Viewer` role. Without that grant, reports return 403.
//
// We avoid relying on custom dimensions (author, story_id, etc.) because
// they require manual registration in GA4 Admin. Instead we report on
// `pagePath`, then attribute paths to authors by joining with Firestore.

import { BetaAnalyticsDataClient } from '@google-analytics/data';

let _client = null;

function getCredentials() {
  // Prefer the inline JSON env var (Vercel) over the file path (local).
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (inline) {
    return JSON.parse(typeof inline === 'string' ? inline : JSON.stringify(inline));
  }
  // Fall back to GOOGLE_APPLICATION_CREDENTIALS file path (local dev).
  return undefined; // SDK will use ADC automatically
}

export function getGA4Client() {
  if (_client) return _client;
  const creds = getCredentials();
  _client = new BetaAnalyticsDataClient(creds ? { credentials: creds } : undefined);
  return _client;
}

export const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || '';
export const GA4_DATA_API_LIVE = !!GA4_PROPERTY_ID;
export const GA4_PROPERTY_PATH = GA4_PROPERTY_ID ? `properties/${GA4_PROPERTY_ID}` : null;

// Run a Data API report. Throws on error so callers can surface "GA4 not yet
// connected" status instead of crashing the dashboard.
export async function runReport(request) {
  if (!GA4_DATA_API_LIVE) throw new Error('GA4_PROPERTY_ID not set');
  const client = getGA4Client();
  const [response] = await client.runReport({
    property: GA4_PROPERTY_PATH,
    ...request,
  });
  return response;
}

// Pageviews by article-page path over a date range. Returns an array of
// { path, pageViews, totalUsers } sorted by pageViews desc.
export async function articlePageviews({ startDate = '7daysAgo', endDate = 'today', limit = 200 } = {}) {
  const res = await runReport({
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
    dimensionFilter: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: { matchType: 'BEGINS_WITH', value: '/article/' },
      },
    },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit,
  });
  return (res.rows || []).map(r => ({
    path: r.dimensionValues[0].value,
    pageViews: Number(r.metricValues[0].value || 0),
    totalUsers: Number(r.metricValues[1].value || 0),
  }));
}

// Daily total pageviews across the whole site for a date range.
export async function dailyPageviews({ startDate = '7daysAgo', endDate = 'today' } = {}) {
  const res = await runReport({
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  });
  return (res.rows || []).map(r => ({
    date: r.dimensionValues[0].value, // YYYYMMDD
    pageViews: Number(r.metricValues[0].value || 0),
    totalUsers: Number(r.metricValues[1].value || 0),
  }));
}

// Quick sanity ping — returns small report so health endpoints can verify
// the service account has access without requesting much data.
export async function ping() {
  const res = await runReport({
    dateRanges: [{ startDate: 'today', endDate: 'today' }],
    metrics: [{ name: 'screenPageViews' }],
    limit: 1,
  });
  return {
    propertyId: GA4_PROPERTY_ID,
    rows: res.rowCount || 0,
    todayPageviews: Number(res.rows?.[0]?.metricValues[0]?.value || 0),
  };
}
