'use client';

import { useEffect, useState } from 'react';

function pct(n) {
  if (!Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(1)}%`;
}
function num(n) {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString();
}
function ago(iso) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 1) {
    const hours = Math.floor(ms / 3600000);
    if (hours < 1) return 'just now';
    return `${hours}h ago`;
  }
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RecentCampaigns() {
  const [data, setData] = useState(null); // { campaigns: [] } | { error }
  const [loading, setLoading] = useState(true);
  const [showSent, setShowSent] = useState(true);
  const [showDrafts, setShowDrafts] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/newsletters/campaigns?limit=50', { cache: 'no-store' });
        const body = await res.json();
        if (!cancelled) setData(res.ok ? body : { error: body.error || `HTTP ${res.status}` });
      } catch (err) {
        if (!cancelled) setData({ error: err.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="bg-white rounded-lg border border-ink-200 p-5">
        <h3 className="text-xs font-bold uppercase tracking-eyebrow text-ink-500 mb-3">Recent campaigns</h3>
        <div className="text-sm text-ink-500">Loading from Constant Contact…</div>
      </section>
    );
  }

  if (data?.error) {
    return (
      <section className="bg-white rounded-lg border border-ink-200 p-5">
        <h3 className="text-xs font-bold uppercase tracking-eyebrow text-ink-500 mb-3">Recent campaigns</h3>
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
          Couldn&apos;t reach Constant Contact: {data.error}
        </div>
      </section>
    );
  }

  const campaigns = data?.campaigns || [];
  const filtered = campaigns.filter(c => {
    const s = (c.status || '').toLowerCase();
    const isSent = s === 'sent' || s === 'done' || c.lastSentAt;
    if (isSent && !showSent) return false;
    if (!isSent && !showDrafts) return false;
    return true;
  });

  // Aggregate stats card
  const totals = filtered.reduce((acc, c) => {
    if (c.stats) {
      acc.sends += c.stats.sends || 0;
      acc.opens += c.stats.opens || 0;
      acc.clicks += c.stats.clicks || 0;
      acc.unsubscribes += c.stats.unsubscribes || 0;
    }
    return acc;
  }, { sends: 0, opens: 0, clicks: 0, unsubscribes: 0 });

  return (
    <section className="bg-white rounded-lg border border-ink-200">
      <header className="flex items-center gap-3 p-5 border-b border-ink-200">
        <h3 className="text-xs font-bold uppercase tracking-eyebrow text-ink-500">Recent campaigns</h3>
        <div className="flex gap-1 text-xs">
          <button onClick={() => setShowSent(s => !s)} className={`px-2 py-1 rounded ${showSent ? 'bg-brand-100 text-brand-800' : 'text-ink-500 border border-ink-200'}`}>
            Sent
          </button>
          <button onClick={() => setShowDrafts(s => !s)} className={`px-2 py-1 rounded ${showDrafts ? 'bg-ink-100 text-ink-800' : 'text-ink-500 border border-ink-200'}`}>
            Drafts
          </button>
        </div>
        <span className="ml-auto text-xs text-ink-500">{filtered.length} of {campaigns.length}</span>
      </header>

      {/* Aggregate */}
      {totals.sends > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink-100">
          <Stat label="Total sends" value={num(totals.sends)} />
          <Stat label="Opens" value={num(totals.opens)} sub={pct(totals.sends ? totals.opens / totals.sends : 0)} />
          <Stat label="Clicks" value={num(totals.clicks)} sub={pct(totals.sends ? totals.clicks / totals.sends : 0)} />
          <Stat label="Unsubs" value={num(totals.unsubscribes)} sub={pct(totals.sends ? totals.unsubscribes / totals.sends : 0)} />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm text-ink-500">
          {campaigns.length === 0 ? 'No campaigns in Constant Contact yet.' : 'No campaigns match the filter.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-ink-500 uppercase tracking-eyebrow border-b border-ink-200 bg-ink-50/50">
                <th className="px-4 py-3 font-semibold">Campaign</th>
                <th className="px-4 py-3 font-semibold w-24">Status</th>
                <th className="px-4 py-3 font-semibold text-right w-24">Sends</th>
                <th className="px-4 py-3 font-semibold text-right w-28">Opens</th>
                <th className="px-4 py-3 font-semibold text-right w-28">Clicks</th>
                <th className="px-4 py-3 font-semibold text-right w-24">Unsubs</th>
                <th className="px-4 py-3 font-semibold w-28">Sent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const s = (c.status || '').toLowerCase();
                const isSent = s === 'sent' || s === 'done' || c.lastSentAt;
                return (
                  <tr key={c.campaignId} className="border-b border-ink-100 hover:bg-ink-50/50">
                    <td className="px-4 py-3">
                      <a href={c.activityId
                          ? `https://app.constantcontact.com/pages/campaigns/email-details/details/activity/${c.activityId}`
                          : 'https://app.constantcontact.com/pages/campaigns/'}
                         target="_blank" rel="noreferrer"
                         className="font-medium text-ink-800 hover:text-brand-700">
                        {c.name || '(untitled)'}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-eyebrow rounded ${
                        isSent ? 'bg-green-100 text-green-800' : 'bg-ink-100 text-ink-700'
                      }`}>
                        {isSent ? 'Sent' : (c.status || 'Draft')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.stats ? num(c.stats.sends) : '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.stats ? (
                        <>
                          <span>{num(c.stats.opens)}</span>
                          <span className="text-[10px] text-ink-500 ml-1">{pct(c.stats.openRate)}</span>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.stats ? (
                        <>
                          <span>{num(c.stats.clicks)}</span>
                          <span className="text-[10px] text-ink-500 ml-1">{pct(c.stats.clickRate)}</span>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-600">
                      {c.stats ? num(c.stats.unsubscribes) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500">
                      {ago(c.lastSentAt || c.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="bg-white p-4">
      <div className="text-[10px] font-bold uppercase tracking-eyebrow text-ink-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-ink-900 tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-ink-500 tabular-nums">{sub}</div>}
    </div>
  );
}
