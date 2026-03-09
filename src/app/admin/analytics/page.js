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

      {/* Google Analytics integration note */}
      <div className="bg-brand-50 rounded-xl p-4 border border-brand-100 flex items-center gap-4">
        <span className="text-2xl">📊</span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-brand-800">Google Analytics 4 Connected</h3>
          <p className="text-xs text-ink-600">Real-time data from GA4 + internal platform metrics combined in one dashboard. BigQuery export enabled.</p>
        </div>
        <button className="px-3 py-1.5 text-xs bg-white text-brand-700 rounded-lg border border-brand-200">Open GA4</button>
      </div>
    </div>
  );
}
