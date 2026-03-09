'use client';
import { useState } from 'react';
import { adCampaigns } from '@/data/mock';

const AD_ZONES = [
  { id: 'homepage_top', name: 'Homepage Leaderboard', size: '728x90', gamPath: '/21234/wvnews/homepage_top', fillRate: '92%', cpm: '$8.40' },
  { id: 'homepage_sidebar1', name: 'Homepage Sidebar 1', size: '300x250', gamPath: '/21234/wvnews/homepage_sidebar1', fillRate: '87%', cpm: '$6.20' },
  { id: 'homepage_mid', name: 'Homepage Mid-Content', size: '728x90', gamPath: '/21234/wvnews/homepage_mid', fillRate: '78%', cpm: '$5.80' },
  { id: 'article_top', name: 'Article Top Banner', size: '728x90', gamPath: '/21234/wvnews/article_top', fillRate: '95%', cpm: '$9.10' },
  { id: 'article_inline', name: 'Article Inline', size: '300x250', gamPath: '/21234/wvnews/article_inline', fillRate: '82%', cpm: '$7.50' },
  { id: 'article_sidebar', name: 'Article Sidebar', size: '300x600', gamPath: '/21234/wvnews/article_sidebar', fillRate: '71%', cpm: '$5.40' },
  { id: 'mobile_banner', name: 'Mobile Banner', size: '320x50', gamPath: '/21234/wvnews/mobile_banner', fillRate: '88%', cpm: '$3.20' },
];

export default function AdsPage() {
  const [tab, setTab] = useState('campaigns');
  const [gamConnected, setGamConnected] = useState(true);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Active Campaigns', value: '3', sub: '2 direct + 1 self-serve' },
          { label: 'Revenue (MTD)', value: '$7,900', sub: '+12% vs last month' },
          { label: 'Avg. CTR', value: '0.89%', sub: 'Industry avg: 0.35%' },
          { label: 'Fill Rate (GAM)', value: '78%', sub: 'Programmatic backfill on' },
          { label: 'Self-Serve Revenue', value: '$1,200', sub: '3 active advertisers' },
        ].map(s => (
          <div key={s.label} className="stat-card bg-white rounded-lg p-4 shadow-sm border border-ink-100">
            <div className="text-xs text-ink-500">{s.label}</div>
            <div className="text-xl font-bold text-ink-900">{s.value}</div>
            <div className="text-[10px] text-ink-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b border-ink-200 pb-0">
        {[
          { id: 'campaigns', label: 'Campaigns' },
          { id: 'gam', label: 'Google Ad Manager' },
          { id: 'zones', label: 'Ad Zones' },
          { id: 'selfserve', label: 'Self-Service Portal' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-brand-700 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'campaigns' && (
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-800">Active & Recent Campaigns</h3>
            <button className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg">+ New Campaign</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] text-ink-500 uppercase tracking-wider border-b border-ink-100 bg-ink-50/50">
                <th className="px-4 py-3 font-medium">Advertiser</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Zone</th>
                <th className="px-4 py-3 font-medium text-right">Impressions</th>
                <th className="px-4 py-3 font-medium text-right">CTR</th>
                <th className="px-4 py-3 font-medium">Flight</th>
                <th className="px-4 py-3 font-medium text-right">Revenue</th>
                <th className="px-4 py-3 font-medium">GAM Sync</th>
              </tr>
            </thead>
            <tbody>
              {adCampaigns.map(ad => (
                <tr key={ad.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-ink-800">{ad.advertiser}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">Direct</span></td>
                  <td className="px-4 py-3 text-sm text-ink-600">{ad.zone}</td>
                  <td className="px-4 py-3 text-sm text-right text-ink-700">{ad.impressions}</td>
                  <td className="px-4 py-3 text-sm text-right text-ink-700">{ad.ctr}</td>
                  <td className="px-4 py-3 text-sm text-ink-600">{ad.flight}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-ink-900">{ad.revenue}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 text-[10px] font-bold rounded bg-green-100 text-green-700">Synced to GAM</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'gam' && (
        <div className="space-y-4">
          <div className={`rounded-xl p-5 border ${gamConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{gamConnected ? '✅' : '❌'}</span>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-ink-800">Google Ad Manager {gamConnected ? 'Connected' : 'Not Connected'}</h3>
                <p className="text-xs text-ink-600">{gamConnected ? 'Network ID: 21234 · Last sync: 2 min ago · 7 ad units active' : 'Connect your GAM account to sync campaigns and enable programmatic.'}</p>
              </div>
              <button className="px-3 py-1.5 text-xs bg-white text-ink-600 rounded-lg border border-ink-200">Sync Now</button>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
            <h3 className="text-sm font-bold text-ink-800 mb-3">How GAM + Self-Serve Works</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                { s: '1', t: 'Advertiser Books', d: 'Selects zone, dates, uploads creative, pays via Stripe', i: '🛒' },
                { s: '2', t: 'Auto-Creates Line Item', d: 'WPP creates a GAM line item with targeting and creative', i: '🔄' },
                { s: '3', t: 'GAM Serves Ad', d: 'Google handles delivery, pacing, frequency capping', i: '📡' },
                { s: '4', t: 'Reports Flow Back', d: 'Impressions and clicks sync to WPP dashboard in real-time', i: '📊' },
              ].map(item => (
                <div key={item.s}><div className="text-2xl mb-2">{item.i}</div><div className="text-xs font-bold text-ink-800">{item.t}</div><div className="text-[10px] text-ink-500 mt-1">{item.d}</div></div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
            <h3 className="text-sm font-bold text-ink-800 mb-3">GAM Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-ink-500 block mb-1">GAM Network ID</label><input className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm font-mono" defaultValue="21234" /></div>
              <div><label className="text-xs text-ink-500 block mb-1">Programmatic Backfill</label><select className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm"><option>AdSense (enabled)</option><option>Ad Exchange</option><option>Disabled</option></select></div>
            </div>
            <button className="mt-3 px-4 py-2 bg-brand-700 text-white text-sm rounded-lg">Save GAM Settings</button>
          </div>
        </div>
      )}

      {tab === 'zones' && (
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
            <p className="text-xs text-ink-500">Each zone maps to a GAM ad unit. Control placement in the Layout Builder.</p>
            <button className="px-4 py-2 bg-brand-700 text-white text-sm rounded-lg">+ New Zone</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] text-ink-500 uppercase tracking-wider border-b border-ink-100 bg-ink-50/50">
                <th className="px-4 py-3 font-medium">Zone</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium font-mono">GAM Path</th>
                <th className="px-4 py-3 font-medium text-right">Fill Rate</th>
                <th className="px-4 py-3 font-medium text-right">CPM</th>
                <th className="px-4 py-3 font-medium">Self-Serve</th>
              </tr>
            </thead>
            <tbody>
              {AD_ZONES.map(z => (
                <tr key={z.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-ink-800">{z.name}</td>
                  <td className="px-4 py-3 text-sm text-ink-600">{z.size}</td>
                  <td className="px-4 py-3 text-xs font-mono text-ink-500">{z.gamPath}</td>
                  <td className="px-4 py-3 text-sm text-right text-ink-700">{z.fillRate}</td>
                  <td className="px-4 py-3 text-sm text-right text-ink-700">{z.cpm}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 text-[10px] font-bold rounded bg-green-100 text-green-700">On</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'selfserve' && (
        <div className="bg-brand-50 rounded-xl p-5 border border-brand-100">
          <h3 className="text-sm font-bold text-brand-800 mb-2">Advertiser Self-Service Portal</h3>
          <p className="text-sm text-ink-600 mb-3">Advertisers visit <strong>ads.wvnews.com</strong>, create an account, upload creative, select zones and dates, pay via Stripe, and their campaign auto-schedules into Google Ad Manager.</p>
          <div className="bg-white rounded-lg p-3 border border-brand-200 mb-3">
            <ol className="text-xs text-ink-600 space-y-1">
              <li>1. Advertiser creates account or logs in</li>
              <li>2. Selects ad zone(s) from available inventory calendar</li>
              <li>3. Chooses flight dates and daily/total budget</li>
              <li>4. Uploads banner creative (image or HTML5)</li>
              <li>5. Reviews pricing and pays via Stripe checkout</li>
              <li>6. Campaign auto-creates as a GAM line item</li>
              <li>7. Live impression/click dashboard for the advertiser</li>
              <li>8. Auto-invoice and receipt via Stripe</li>
            </ol>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs bg-white text-brand-700 rounded-lg border border-brand-200">Configure Rate Cards</button>
            <button className="px-3 py-1.5 text-xs bg-white text-brand-700 rounded-lg border border-brand-200">Manage Advertisers</button>
            <button className="px-3 py-1.5 text-xs bg-white text-brand-700 rounded-lg border border-brand-200">Review Pending Creatives</button>
          </div>
        </div>
      )}
    </div>
  );
}
