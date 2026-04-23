// Artist production queue — reads live orders from the wvnews-crm Firestore.
// Server component so the Firestore read happens on the server with the admin
// SDK credentials; client-side interactivity (upload modal) is delegated to the
// AdOrderRow client component.

import Link from 'next/link';
import { db } from '@/lib/firebase-admin';
import AdOrderRow from './AdOrderRow';

// Avoid caching between requests; artist queue should reflect live CRM state.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const fmtUSD = (n) => typeof n === 'number' ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}` : '—';

// Queue = orders that still need creative produced. We treat any print order
// whose print.artworkStatus is not "Complete" (or equivalent) as needing work.
// In Firestore these values are free-form strings ("In Graphics", "", null).
async function fetchQueue({ limit = 50 } = {}) {
  // Composite query for ordered + filtered is not available without an index,
  // so pull a page and filter client-side. Good enough for prototype.
  const snap = await db.collection('orders')
    .orderBy('created', 'desc')
    .limit(300)
    .get();

  const rows = [];
  const completed = [];
  for (const doc of snap.docs) {
    const o = { id: doc.id, ...doc.data() };
    const status = o.print?.artworkStatus || '';
    const needsWork = status && status.toLowerCase() !== 'complete' && !o.artworkUrl;
    (needsWork ? rows : completed).push(o);
    if (rows.length >= limit) break;
  }
  return { queue: rows, recentCompleted: completed.slice(0, 10) };
}

async function fetchSummary() {
  const [ordersCountSnap, advertisersCountSnap] = await Promise.all([
    db.collection('orders').count().get(),
    db.collection('advertisers').count().get(),
  ]);
  return {
    totalOrders: ordersCountSnap.data().count,
    totalAdvertisers: advertisersCountSnap.data().count,
  };
}

export default async function AdsPage() {
  const [{ queue, recentCompleted }, summary] = await Promise.all([fetchQueue(), fetchSummary()]);
  const pendingCount = queue.filter(o => (o.print?.artworkStatus || '').toLowerCase().includes('graphics')).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900">Ad Production Queue</h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Live from <code className="text-xs bg-ink-100 px-1.5 py-0.5 rounded">wvnews-crm</code> · {summary.totalOrders.toLocaleString()} total orders · {summary.totalAdvertisers.toLocaleString()} advertisers
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/ads/gam" className="px-3 py-2 bg-white text-ink-700 text-sm font-medium rounded-lg border border-ink-200 hover:bg-ink-50">
            GAM Settings
          </Link>
          <button className="px-3 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">
            + Manual Order
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="In Queue" value={queue.length} hint="Orders awaiting artwork" accent />
        <Stat label="In Graphics" value={pendingCount} hint="Actively being worked" />
        <Stat label="Completed Recently" value={recentCompleted.length} hint="Last 300 orders" />
        <Stat label="Total Orders (CRM)" value={summary.totalOrders.toLocaleString()} hint="All-time" />
      </div>

      {/* Queue table */}
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h3 className="font-display text-lg font-bold text-ink-900">Needs Artwork ({queue.length})</h3>
          <div className="text-xs text-ink-500">Sorted newest first</div>
        </div>
        {queue.length === 0 ? (
          <div className="p-10 text-center text-ink-500">
            <div className="text-4xl mb-2">✨</div>
            Nothing in the queue. All caught up.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ink-50/50 border-b border-ink-100">
              <tr className="text-left text-xs font-semibold text-ink-600 uppercase tracking-wider">
                <th className="px-5 py-3">Advertiser</th>
                <th className="px-5 py-3">Ad #</th>
                <th className="px-5 py-3">Type / Size</th>
                <th className="px-5 py-3">Run Dates</th>
                <th className="px-5 py-3">Artwork Status</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {queue.map(o => (
                <AdOrderRow key={o.id} order={o} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recently completed */}
      {recentCompleted.length > 0 && (
        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100">
            <h3 className="font-display text-lg font-bold text-ink-900">Recently Completed</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-ink-50/50 border-b border-ink-100">
              <tr className="text-left text-xs font-semibold text-ink-600 uppercase tracking-wider">
                <th className="px-5 py-3">Advertiser</th>
                <th className="px-5 py-3">Ad #</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Run</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {recentCompleted.map(o => (
                <tr key={o.id} className="hover:bg-ink-50/50">
                  <td className="px-5 py-3 font-semibold text-ink-900">{o.aname || '—'}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-600">{o.adNum || '—'}</td>
                  <td className="px-5 py-3 text-ink-700">
                    {o.type || '—'} {o.print?.sz && <span className="text-ink-500">· {o.print.sz}</span>}
                  </td>
                  <td className="px-5 py-3 text-ink-600">{fmtDate(o.startDate)}</td>
                  <td className="px-5 py-3 text-right font-semibold">{fmtUSD(o.amt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint, accent }) {
  return (
    <div className={`rounded-xl p-5 border ${accent ? 'bg-brand-50 border-brand-200' : 'bg-white border-ink-200'}`}>
      <div className="text-xs font-medium text-ink-500 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-ink-900 mt-1">{value}</div>
      {hint && <div className="text-xs text-ink-500 mt-1">{hint}</div>}
    </div>
  );
}
