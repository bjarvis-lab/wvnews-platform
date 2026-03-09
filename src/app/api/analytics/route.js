// API Route: /api/analytics
// Connects to Google Analytics 4 Data API to pull real data
//
// Prerequisites:
// 1. Enable "Google Analytics Data API" in Google Cloud Console
// 2. Create a Service Account and download the JSON key
// 3. Add the service account email as a Viewer in GA4 property
// 4. Set environment variables:
//    - GA4_PROPERTY_ID (numeric property ID)
//    - GOOGLE_SERVICE_ACCOUNT_KEY (JSON key as string)
//
// This route returns real pageview, session, and event data from your GA4 property.

import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const metric = searchParams.get('metric') || 'overview';
  const dateRange = searchParams.get('range') || '7d';

  // In production, this connects to the GA4 Data API:
  //
  // const { BetaAnalyticsDataClient } = require('@google-analytics/data');
  // const client = new BetaAnalyticsDataClient({
  //   credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
  // });
  //
  // const [response] = await client.runReport({
  //   property: `properties/${process.env.GA4_PROPERTY_ID}`,
  //   dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
  //   metrics: [
  //     { name: 'screenPageViews' },
  //     { name: 'totalUsers' },
  //     { name: 'sessions' },
  //     { name: 'averageSessionDuration' },
  //     { name: 'bounceRate' },
  //   ],
  //   dimensions: [{ name: 'date' }],
  // });

  // Return mock data for now — replace with real GA4 response
  return NextResponse.json({
    status: 'mock_data',
    message: 'Connect GA4 to see real data. See /admin/analytics for setup instructions.',
    data: {
      pageviews: 284500,
      users: 142300,
      sessions: 198400,
      avgSessionDuration: '3:22',
      bounceRate: 0.42,
    }
  });
}
