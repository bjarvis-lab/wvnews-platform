'use client';
import { subscribers } from '@/data/mock';

export default function SubscribersPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Registered', value: '42,800' },
          { label: 'Digital Subscribers', value: '3,240' },
          { label: 'Print + Digital', value: '1,890' },
          { label: 'E-Edition Only', value: '780' },
          { label: 'MRR', value: '$38,420' },
        ].map(s => (
          <div key={s.label} className="stat-card bg-white rounded-lg p-4 shadow-sm border border-ink-100">
            <div className="text-xs text-ink-500">{s.label}</div>
            <div className="text-xl font-bold text-ink-900">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input type="text" placeholder="Search by name, email, ZIP, or account..." className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-ink-200 text-sm" />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select className="px-3 py-2 bg-white rounded-lg border border-ink-200 text-sm"><option>All Tiers</option><option>Digital All-Access</option><option>Print + Digital</option><option>E-Edition</option><option>Registered Free</option></select>
        <select className="px-3 py-2 bg-white rounded-lg border border-ink-200 text-sm"><option>All Status</option><option>Active</option><option>Past Due</option><option>Cancelled</option></select>
        <button className="px-3 py-2 bg-white text-ink-600 text-sm rounded-lg border border-ink-200">Export CSV</button>
        <button className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg">+ Add Subscriber</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[11px] text-ink-500 uppercase tracking-wider border-b border-ink-100 bg-ink-50/50">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Since</th>
              <th className="px-4 py-3 font-medium">ZIP</th>
              <th className="px-4 py-3 font-medium text-right">Revenue</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map(sub => (
              <tr key={sub.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                <td className="px-4 py-3 text-sm font-medium text-ink-800">{sub.name}</td>
                <td className="px-4 py-3 text-sm text-ink-600">{sub.email}</td>
                <td className="px-4 py-3 text-sm text-ink-600">{sub.tier}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-bold rounded ${sub.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{sub.status}</span></td>
                <td className="px-4 py-3 text-sm text-ink-600">{sub.since}</td>
                <td className="px-4 py-3 text-sm text-ink-600">{sub.zip}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-ink-900">{sub.revenue}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="px-2 py-1 text-xs text-brand-700 hover:bg-brand-50 rounded">Manage</button>
                    <button className="px-2 py-1 text-xs text-ink-500 hover:bg-ink-50 rounded">⋯</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stripe + PrintManager */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
          <h3 className="text-sm font-bold text-ink-800 mb-2">Stripe Integration</h3>
          <p className="text-xs text-ink-500 mb-3">All subscription billing managed through Stripe. Subscribers self-manage via Stripe Customer Portal.</p>
          <button className="px-3 py-1.5 text-xs bg-brand-50 text-brand-700 rounded-lg border border-brand-200">Open Stripe Dashboard</button>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
          <h3 className="text-sm font-bold text-ink-800 mb-2">PrintManager Sync</h3>
          <p className="text-xs text-ink-500 mb-3">Print subscriber records sync to your PrintManager system. Digital access updates push automatically.</p>
          <button className="px-3 py-1.5 text-xs bg-brand-50 text-brand-700 rounded-lg border border-brand-200">Configure Sync</button>
        </div>
      </div>
    </div>
  );
}
