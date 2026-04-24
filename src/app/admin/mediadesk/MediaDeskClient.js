'use client';
// Live feed of incoming WV media signals. Filter by source type, beat, or
// keyword. Stats bar up top shows total sources monitored + last collector run.
//
// Trending detection + alerts come in the next session; for now this is a
// clean feed you can scan every morning.

import { useState, useMemo } from 'react';

function fmtAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const mins = Math.max(0, Math.floor((Date.now() - d) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const KIND_META = {
  tv:         { label: 'TV',         icon: '📺', tone: 'bg-red-100 text-red-800' },
  paper:      { label: 'Newspaper',  icon: '📰', tone: 'bg-blue-100 text-blue-800' },
  radio:      { label: 'Radio',      icon: '📻', tone: 'bg-purple-100 text-purple-800' },
  public:     { label: 'Public',     icon: '📻', tone: 'bg-purple-100 text-purple-800' },
  gov:        { label: 'Gov',        icon: '🏛️', tone: 'bg-emerald-100 text-emerald-800' },
  county:     { label: 'County',     icon: '🏛️', tone: 'bg-emerald-50 text-emerald-700' },
  city:       { label: 'City',       icon: '🏛️', tone: 'bg-emerald-50 text-emerald-700' },
  edu:        { label: 'Edu',        icon: '🎓', tone: 'bg-amber-100 text-amber-800' },
  wire:       { label: 'Wire',       icon: '🛰️', tone: 'bg-ink-200 text-ink-800' },
  national:   { label: 'National',   icon: '🌐', tone: 'bg-ink-200 text-ink-800' },
  'google-news': { label: 'Google News', icon: '🔎', tone: 'bg-gold-100 text-gold-900' },
};

export default function MediaDeskClient({ signals, stats, collectorStats }) {
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');

  const allKinds = useMemo(() => {
    const set = new Set(signals.map(s => s.kind).filter(Boolean));
    return Array.from(set).sort();
  }, [signals]);
  const allSources = useMemo(() => {
    const set = new Set(signals.map(s => s.sourceName).filter(Boolean));
    return Array.from(set).sort();
  }, [signals]);
  const allTopics = useMemo(() => {
    const set = new Set(signals.map(s => s.topic).filter(Boolean));
    return Array.from(set).sort();
  }, [signals]);

  const filtered = signals.filter(s => {
    if (kindFilter !== 'all' && s.kind !== kindFilter) return false;
    if (sourceFilter !== 'all' && s.sourceName !== sourceFilter) return false;
    if (topicFilter !== 'all' && s.topic !== topicFilter) return false;
    if (search) {
      const hay = `${s.title} ${s.summary || ''} ${s.sourceName || ''}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header + stats */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-ink-900">Media Desk</h2>
            <p className="text-sm text-ink-500 mt-0.5">
              Live feed from {stats.withRss} RSS sources + {stats.queries} Google News topics across West Virginia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
          <Stat label="Total sources" value={stats.total} />
          <Stat label="Live RSS feeds" value={stats.withRss} />
          <Stat label="Google News topics" value={stats.queries} />
          <Stat label="FB pages registered" value={stats.fbPages} />
          <Stat label="Signals in feed" value={signals.length} tone="bg-brand-50 border-brand-200" />
          <Stat
            label="Last collected"
            value={collectorStats?.runAt ? fmtAgo(collectorStats.runAt) : '—'}
            hint={collectorStats ? `${collectorStats.totalItems || 0} items` : 'never'}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-ink-200">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search headlines, sources…"
          className="flex-1 min-w-[220px] px-3 py-2 border border-ink-200 rounded text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select value={kindFilter} onChange={e => setKindFilter(e.target.value)} className="px-3 py-2 border border-ink-200 rounded text-sm bg-white">
          <option value="all">All kinds</option>
          {allKinds.map(k => <option key={k} value={k}>{KIND_META[k]?.label || k}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="px-3 py-2 border border-ink-200 rounded text-sm bg-white max-w-[240px]">
          <option value="all">All sources</option>
          {allSources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)} className="px-3 py-2 border border-ink-200 rounded text-sm bg-white">
          <option value="all">All topics</option>
          {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-xs text-ink-500 ml-auto">Showing {filtered.length} of {signals.length}</span>
      </div>

      {/* Feed */}
      {signals.length === 0 ? (
        <div className="bg-white rounded-xl border border-ink-200 p-10 text-center">
          <div className="text-5xl mb-3">📡</div>
          <h3 className="font-display text-xl font-bold text-ink-900">No signals yet</h3>
          <p className="text-sm text-ink-600 mt-2 max-w-md mx-auto">
            The collector hasn&apos;t run yet, or it couldn&apos;t reach any sources. Run it manually:
            <br />
            <code className="inline-block mt-2 px-2 py-1 bg-ink-100 rounded text-xs font-mono">
              GOOGLE_APPLICATION_CREDENTIALS=~/secrets/wvnews-crm-sa.json node scripts/collect-media-signals.mjs
            </code>
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-ink-200 divide-y divide-ink-100">
          {filtered.map(signal => (
            <SignalRow key={signal.id} signal={signal} />
          ))}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-ink-500">No signals match your filter.</div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint, tone }) {
  return (
    <div className={`rounded-lg p-3 border ${tone || 'bg-white border-ink-200'}`}>
      <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">{label}</div>
      <div className="text-xl font-bold text-ink-900 mt-0.5">{value}</div>
      {hint && <div className="text-[10px] text-ink-500">{hint}</div>}
    </div>
  );
}

function SignalRow({ signal }) {
  const meta = KIND_META[signal.kind] || { label: signal.kind, icon: '📌', tone: 'bg-ink-100 text-ink-700' };
  return (
    <a
      href={signal.url}
      target="_blank"
      rel="noreferrer"
      className="block p-4 hover:bg-ink-50/50 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-16 h-12 bg-ink-100 rounded overflow-hidden">
          {signal.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signal.imageUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider ${meta.tone}`}>
              {meta.icon} {meta.label}
            </span>
            <span className="text-xs font-semibold text-ink-700 truncate">{signal.sourceName}</span>
            {signal.topic && (
              <span className="text-[10px] text-gold-900 bg-gold-50 px-1.5 py-0.5 rounded">{signal.topic}</span>
            )}
            <span className="text-xs text-ink-400 ml-auto whitespace-nowrap">{fmtAgo(signal.lastSeenAt || signal.publishedAt)}</span>
          </div>
          <div className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors leading-snug">
            {signal.title}
          </div>
          {signal.summary && (
            <div className="text-sm text-ink-600 mt-1 line-clamp-2">{signal.summary}</div>
          )}
          <div className="mt-2 text-[11px] text-ink-400 truncate">{signal.url}</div>
        </div>
      </div>
    </a>
  );
}
