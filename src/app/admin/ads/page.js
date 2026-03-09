'use client';
import { adCampaigns } from '@/data/mock';

export default function AdsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Campaigns', value: '3' },
          { label: 'Total Revenue (MTD)', value: '$7,900' },
          { label: 'Avg. CTR', value: '0.89%' },
          { label: 'Fill Rate', value: '78%' },
        ].map(s => (
          <div key={s.label} className="stat-card bg-white rounded-lg p-4 shadow-sm border border-ink-100">
            <div className="text-xs text-ink-500">{s.label}</div>
            <div className="text-xl font-bold text-ink-900">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink-800">Ad Campaigns</h3>
          <button className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-600">+ New Campaign</button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-[11px] text-ink-500 uppercase tracking-wider border-b border-ink-100 bg-ink-50/50">
              <th className="px-4 py-3 font-medium">Advertiser</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Zone</th>
              <th className="px-4 py-3 font-medium text-right">Impressions</th>
              <th className="px-4 py-3 font-medium text-right">Clicks</th>
              <th className="px-4 py-3 font-medium text-right">CTR</th>
              <th className="px-4 py-3 font-medium">Flight</th>
              <th className="px-4 py-3 font-medium text-right">Revenue</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {adCampaigns.map(ad => (
              <tr key={ad.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                <td className="px-4 py-3 text-sm font-medium text-ink-800">{ad.advertiser}</td>
                <td className="px-4 py-3 text-sm text-ink-600">{ad.type}</td>
                <td className="px-4 py-3 text-sm text-ink-600">{ad.zone}</td>
                <td className="px-4 py-3 text-sm text-right text-ink-700">{ad.impressions}</td>
                <td className="px-4 py-3 text-sm text-right text-ink-700">{ad.clicks}</td>
                <td className="px-4 py-3 text-sm text-right text-ink-700">{ad.ctr}</td>
                <td className="px-4 py-3 text-sm text-ink-600">{ad.flight}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-ink-900">{ad.revenue}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-bold rounded ${ad.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{ad.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Self-service portal */}
      <div className="bg-brand-50 rounded-xl p-5 border border-brand-100">
        <h3 className="text-sm font-bold text-brand-800 mb-2">Advertiser Self-Service Portal</h3>
        <p className="text-sm text-ink-600 mb-3">Advertisers can create campaigns, upload creative, select zones, and pay via Stripe — all without staff involvement.</p>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs bg-white text-brand-700 rounded-lg border border-brand-200">Configure Ad Zones</button>
          <button className="px-3 py-1.5 text-xs bg-white text-brand-700 rounded-lg border border-brand-200">Manage Rate Cards</button>
          <button className="px-3 py-1.5 text-xs bg-white text-brand-700 rounded-lg border border-brand-200">View Invoices</button>
        </div>
      </div>
    </div>
  );
}
