'use client';
import { analyticsData, stories } from '@/data/mock';

export default function AnalyticsPage() {
  const { overview, trafficSources, dailyViews, paywallFunnel } = analyticsData;
  const max = Math.max(...dailyViews.map(d => d.views));

  return (
    <div className="space-y-6">
      {/* Date range */}
      <div className="flex items-center gap-3">
        <select className="px-3 py-2 bg-white rounded-lg border border-ink-200 text-sm"><option>Last 7 Days</option><option>Last 30 Days</option><option>This Month</option></select>
        <select className="px-3 py-2 bg-white rounded-lg border border-ink-200 text-sm"><option>All Sites</option><option>WVNews</option><option>Exponent</option></select>
        <div className="flex-1" />
        <button className="px-3 py-2 bg-white text-ink-600 text-sm rounded-lg border border-ink-200">Export CSV</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(overview).map(([key, val]) => (
          <div key={key} className="stat-card bg-white rounded-lg p-3 shadow-sm border border-ink-100">
            <div className="text-[10px] font-medium text-ink-500 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
            <div className="text-lg font-bold text-ink-900">{typeof val === 'number' ? val.toLocaleString() : val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
          <h3 className="text-sm font-bold text-ink-800 mb-4">Daily Pageviews</h3>
          <div className="flex items-end gap-2 h-40">
            {dailyViews.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-ink-500 font-medium">{(d.views/1000).toFixed(0)}K</div>
                <div className="w-full bg-brand-500 rounded-t" style={{ height: `${(d.views / max) * 120}px` }} />
                <span className="text-[10px] text-ink-400">{d.date.split(' ')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
          <h3 className="text-sm font-bold text-ink-800 mb-4">Subscription Conversion Funnel</h3>
          <div className="space-y-3">
            {paywallFunnel.map((step, i) => (
              <div key={step.stage}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-ink-700 font-medium">{step.stage}</span>
                  <span className="text-ink-900 font-bold">{step.count.toLocaleString()}</span>
                </div>
                <div className="h-6 bg-ink-100 rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-700 to-brand-400 rounded flex items-center px-2"
                    style={{ width: `${(step.count / paywallFunnel[0].count) * 100}%` }}>
                    {i > 0 && <span className="text-white text-[10px] font-bold">{((step.count / paywallFunnel[i-1].count) * 100).toFixed(1)}%</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
        <h3 className="text-sm font-bold text-ink-800 mb-4">Revenue Breakdown (MTD)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Digital Subscriptions', value: '$8,430', change: '+12%' },
            { label: 'E-Edition', value: '$1,240', change: '+5%' },
            { label: 'Display Advertising', value: '$4,800', change: '-3%' },
            { label: 'Classified Ads', value: '$620', change: '+8%' },
            { label: 'Paid Submissions', value: '$340', change: '+15%' },
          ].map(r => (
            <div key={r.label} className="p-3 bg-ink-50 rounded-lg">
              <div className="text-xs text-ink-500">{r.label}</div>
              <div className="text-lg font-bold text-ink-900">{r.value}</div>
              <div className={`text-xs font-medium ${r.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>{r.change}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Google Analytics 4 Connection */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📊</span>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-ink-800">Connect Your Google Analytics 4</h3>
            <p className="text-xs text-ink-500">Pull real data from your existing GA4 property into this dashboard.</p>
          </div>
          <span className="px-3 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 rounded-lg">Setup Required</span>
        </div>

        <div className="bg-ink-50 rounded-lg p-4 mb-4">
          <h4 className="text-xs font-bold text-ink-700 mb-2">Step-by-Step Setup</h4>
          <ol className="space-y-2 text-xs text-ink-600">
            <li><strong>1. Get your GA4 Measurement ID:</strong> Go to <a href="https://analytics.google.com" target="_blank" className="text-brand-700 underline">analytics.google.com</a> → Admin → Data Streams → Select your wvnews.com stream → Copy the Measurement ID (starts with G-).</li>
            <li><strong>2. Add it to Vercel:</strong> In your Vercel project → Settings → Environment Variables → Add: <code className="bg-white px-1.5 py-0.5 rounded border text-[11px] font-mono">NEXT_PUBLIC_GA_ID = G-XXXXXXXXXX</code></li>
            <li><strong>3. Enable GA4 Data API:</strong> Go to <a href="https://console.cloud.google.com" target="_blank" className="text-brand-700 underline">Google Cloud Console</a> → Enable &quot;Google Analytics Data API&quot; → Create a Service Account → Download the JSON key.</li>
            <li><strong>4. Grant access:</strong> In GA4 Admin → Property Access Management → Add the service account email as Viewer.</li>
            <li><strong>5. Add credentials to Vercel:</strong> Add the service account JSON as <code className="bg-white px-1.5 py-0.5 rounded border text-[11px] font-mono">GOOGLE_SERVICE_ACCOUNT_KEY</code> environment variable.</li>
            <li><strong>6. Redeploy.</strong> The dashboard will start showing real pageviews, sessions, top pages, and conversion data from your existing GA4.</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-ink-500 block mb-1">GA4 Measurement ID</label>
            <input className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm font-mono" placeholder="G-XXXXXXXXXX" />
          </div>
          <div>
            <label className="text-xs text-ink-500 block mb-1">GA4 Property ID (numeric)</label>
            <input className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm font-mono" placeholder="123456789" />
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 bg-brand-700 text-white text-sm rounded-lg hover:bg-brand-600">Test Connection</button>
          <button className="px-4 py-2 bg-white text-ink-600 text-sm rounded-lg border border-ink-200">Save Configuration</button>
          <a href="https://analytics.google.com" target="_blank" className="px-4 py-2 bg-white text-ink-600 text-sm rounded-lg border border-ink-200 inline-flex items-center gap-1">Open GA4 →</a>
        </div>
      </div>

      {/* What real data looks like */}
      <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
        <h4 className="text-xs font-bold text-brand-800 mb-2">Once Connected, This Dashboard Will Show:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-ink-600">
          <div>✅ Real-time pageviews by article</div>
          <div>✅ Top pages and sections</div>
          <div>✅ Traffic sources (search, social, direct)</div>
          <div>✅ New vs returning visitors</div>
          <div>✅ Geographic heatmap (reader locations)</div>
          <div>✅ Paywall conversion events</div>
          <div>✅ Newsletter signup events</div>
          <div>✅ Subscription checkout funnel</div>
        </div>
      </div>
    </div>
  );
}
