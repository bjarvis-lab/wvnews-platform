// Live admin/subscribers page — reads from the `subscribers` collection.
// Computed stats are derived from the same fetch so there's no second
// round-trip. The "Send claim email" action is a small client island.

import { listSubscribers } from '@/lib/subscribers-db';
import { requireAdmin } from '@/lib/auth-server';
import SendClaimButton from './SendClaimButton';

export const dynamic = 'force-dynamic';

const TIER_LABELS = {
  'print-bundle-active': 'Print + Digital',
  'print-bundle-unclaimed': 'Print (unclaimed)',
  'print-only-no-email': 'Print only',
  'digital-only': 'Digital',
  'comp': 'Comp',
};

export default async function SubscribersPage() {
  await requireAdmin();
  const rows = await listSubscribers({ limit: 500 });

  const buckets = {
    'print-bundle-active': 0,
    'print-bundle-unclaimed': 0,
    'print-only-no-email': 0,
    'digital-only': 0,
    'comp': 0,
  };
  for (const r of rows) {
    if (buckets[r.bundleType] !== undefined) buckets[r.bundleType]++;
  }
  const total = rows.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total subscribers', value: total },
          { label: 'Print + Digital', value: buckets['print-bundle-active'] },
          { label: 'Print (unclaimed)', value: buckets['print-bundle-unclaimed'] },
          { label: 'Digital-only', value: buckets['digital-only'] },
          { label: 'Comp', value: buckets['comp'] },
        ].map(s => (
          <div key={s.label} className="stat-card bg-white rounded-lg p-4 shadow-sm border border-ink-100">
            <div className="text-xs text-ink-500">{s.label}</div>
            <div className="text-xl font-bold text-ink-900">{s.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-ink-500">
            <div className="text-base font-semibold text-ink-700 mb-1">No subscribers yet</div>
            <div className="text-xs">When PrintManager adds subscribers or readers subscribe via /subscribe, they’ll show up here.</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] text-ink-500 uppercase tracking-wider border-b border-ink-100 bg-ink-50/50">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Edition</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(sub => {
                const claimable = !!sub.email && sub.digital && !sub.digital.hasClaimed;
                const tier = TIER_LABELS[sub.bundleType] || sub.bundleType || '—';
                const active = (sub.print?.active || sub.digital?.active);
                return (
                  <tr key={sub.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-ink-800">{sub.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-ink-600">{sub.email || <span className="text-ink-400">no email</span>}</td>
                    <td className="px-4 py-3 text-sm text-ink-600">{tier}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${active ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600">{sub.print?.edition || '—'}</td>
                    <td className="px-4 py-3 text-sm text-ink-600">{sub.updatedAt ? new Date(sub.updatedAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 items-center">
                        {claimable && <SendClaimButton subscriberId={sub.id} alreadySent={!!sub.digital?.claimEmailSentAt} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
          <h3 className="text-sm font-bold text-ink-800 mb-2">Stripe Integration</h3>
          <p className="text-xs text-ink-500 mb-3">Paid digital subscriptions will run through Stripe. Wired in Phase 3.</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
          <h3 className="text-sm font-bold text-ink-800 mb-2">PrintManager sync</h3>
          <p className="text-xs text-ink-500 mb-3">PrintManager writes here via POST /api/subscribers using the INTERNAL_API_TOKEN. Adding a print subscriber with an email auto-creates the digital record and primes the claim email.</p>
        </div>
      </div>
    </div>
  );
}
