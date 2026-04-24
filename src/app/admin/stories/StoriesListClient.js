'use client';
import { useState } from 'react';
import Link from 'next/link';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diffH = (Date.now() - d) / (1000 * 60 * 60);
  if (diffH < 1) return 'just now';
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  if (diffH < 48) return 'yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function StoriesListClient({ stories, sections, sites }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const visible = stories.filter(s => {
    if (filter === 'published' && s.status !== 'published') return false;
    if (filter === 'draft' && s.status !== 'draft') return false;
    if (filter === 'premium' && s.accessLevel !== 'premium') return false;
    if (search && !(s.headline || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: stories.length,
    published: stories.filter(s => s.status === 'published').length,
    draft: stories.filter(s => s.status === 'draft').length,
    premium: stories.filter(s => s.accessLevel === 'premium').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900">Stories</h2>
          <p className="text-sm text-ink-500 mt-0.5">
            {counts.all} native {counts.all === 1 ? 'story' : 'stories'} · {counts.published} published · {counts.draft} drafts
          </p>
        </div>
        <Link href="/admin/stories/new" className="px-4 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-600">
          + New Story
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-ink-200">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search headlines…"
          className="flex-1 min-w-[200px] px-3 py-2 border border-ink-200 rounded text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex gap-1">
          {['all', 'published', 'draft', 'premium'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded capitalize ${
                filter === f ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {stories.length === 0 ? (
        <div className="bg-white rounded-xl border border-ink-200 p-10 text-center">
          <div className="text-5xl mb-3">📝</div>
          <h3 className="font-display text-xl font-bold text-ink-900">No stories yet</h3>
          <p className="text-sm text-ink-600 mt-2">Create your first native story. It&apos;ll save to Firestore and render on the public site the moment you hit Publish.</p>
          <Link href="/admin/stories/new" className="inline-block mt-4 px-5 py-3 bg-brand-700 text-white font-semibold rounded-lg hover:bg-brand-600">
            + New Story
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-ink-200 p-10 text-center text-ink-500">
          No stories match your filter.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50/50 border-b border-ink-100">
              <tr className="text-left text-xs font-semibold text-ink-600 uppercase tracking-wider">
                <th className="px-5 py-3">Headline</th>
                <th className="px-5 py-3">Section</th>
                <th className="px-5 py-3">Sites</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Access</th>
                <th className="px-5 py-3 text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {visible.map(s => {
                const sec = sections.find(x => x.id === s.section);
                return (
                  <tr key={s.id} className="hover:bg-ink-50/50">
                    <td className="px-5 py-4">
                      <Link href={`/admin/stories/${s.id}/edit`} className="font-semibold text-ink-900 hover:text-brand-700">
                        {s.headline}
                      </Link>
                      {s.deck && <div className="text-xs text-ink-500 mt-0.5 line-clamp-1">{s.deck}</div>}
                    </td>
                    <td className="px-5 py-4 text-ink-700">{sec ? `${sec.icon} ${sec.name}` : s.section}</td>
                    <td className="px-5 py-4 text-ink-600 text-xs">
                      {(s.sites || []).map(id => sites.find(x => x.id === id)?.code || id).join(' · ')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        s.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-100 text-ink-700'
                      }`}>
                        {s.status}
                      </span>
                      {s.featured && <span className="ml-1 text-xs text-gold-700">★</span>}
                      {s.breaking && <span className="ml-1 text-xs text-red-600">●</span>}
                    </td>
                    <td className="px-5 py-4 text-xs text-ink-600 capitalize">{s.accessLevel || 'free'}</td>
                    <td className="px-5 py-4 text-right text-xs text-ink-500">{fmtDate(s.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
