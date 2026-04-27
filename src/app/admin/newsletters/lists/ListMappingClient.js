'use client';

import { useEffect, useState } from 'react';

export default function ListMappingClient({ sites, initialMapping, updatedAt, updatedBy }) {
  const [mapping, setMapping] = useState(initialMapping || {});
  const [ccLists, setCcLists] = useState(null); // null = not loaded; [] = loaded but empty
  const [loadingLists, setLoadingLists] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'
  const [saveMsg, setSaveMsg] = useState('');

  // Load CC lists on first mount.
  useEffect(() => {
    fetchCcLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCcLists() {
    setLoadingLists(true);
    setError('');
    try {
      const res = await fetch('/api/newsletters/cc-lists', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setCcLists(data.lists || []);
    } catch (err) {
      setError(err.message);
      setCcLists([]);
    } finally {
      setLoadingLists(false);
    }
  }

  async function save() {
    setSaveStatus('saving');
    setSaveMsg('');
    try {
      const res = await fetch('/api/newsletters/lists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSaveStatus('saved');
      setSaveMsg('Mapping saved.');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setSaveStatus('error');
      setSaveMsg(err.message);
    }
  }

  function setListFor(siteId, listId) {
    setMapping(prev => {
      const next = { ...prev };
      if (listId) next[siteId] = listId;
      else delete next[siteId];
      return next;
    });
  }

  // Suggest a CC list match by case-insensitive name overlap.
  function suggestionFor(siteName) {
    if (!ccLists || ccLists.length === 0) return null;
    const target = siteName.toLowerCase();
    return ccLists.find(l => l.name.toLowerCase().includes(target.split(' ')[0])) || null;
  }

  const mappedCount = Object.keys(mapping).filter(k => mapping[k]).length;

  return (
    <div className="space-y-4">
      {/* Status row */}
      <div className="bg-white rounded-lg border border-ink-200 p-4 flex items-center gap-4 flex-wrap">
        <div className="text-sm">
          <span className="font-semibold text-ink-800">{mappedCount}</span>
          <span className="text-ink-500"> of {sites.length} publications mapped</span>
          {ccLists && (
            <span className="text-ink-500"> · <span className="font-semibold text-ink-800">{ccLists.length}</span> Constant Contact lists available</span>
          )}
        </div>
        {updatedAt && (
          <div className="text-xs text-ink-500">
            Last saved {new Date(updatedAt).toLocaleString()}{updatedBy ? ` by ${updatedBy}` : ''}
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={fetchCcLists} disabled={loadingLists}
                  className="px-3 py-1.5 text-xs font-semibold text-ink-700 border border-ink-300 rounded hover:bg-ink-50 disabled:opacity-50">
            {loadingLists ? 'Refreshing…' : 'Refresh from CC'}
          </button>
          <button onClick={save} disabled={saveStatus === 'saving'}
                  className="px-4 py-1.5 text-xs font-semibold bg-brand-700 text-white rounded hover:bg-brand-800 disabled:opacity-50">
            {saveStatus === 'saving' ? 'Saving…' : 'Save mapping'}
          </button>
        </div>
      </div>

      {error && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>}
      {saveStatus === 'saved' && <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-3">{saveMsg}</div>}
      {saveStatus === 'error' && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-3">{saveMsg}</div>}

      {/* Mapping table */}
      <div className="bg-white rounded-lg border border-ink-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[11px] text-ink-500 uppercase tracking-eyebrow border-b border-ink-200 bg-ink-50/50">
              <th className="px-4 py-3 font-semibold">Publication</th>
              <th className="px-4 py-3 font-semibold">Market</th>
              <th className="px-4 py-3 font-semibold">Constant Contact list</th>
              <th className="px-4 py-3 font-semibold w-24"></th>
            </tr>
          </thead>
          <tbody>
            {sites.map(site => {
              const current = mapping[site.id];
              const suggestion = !current && suggestionFor(site.name);
              return (
                <tr key={site.id} className="border-b border-ink-100">
                  <td className="px-4 py-3 text-sm font-medium text-ink-800">{site.name}</td>
                  <td className="px-4 py-3 text-xs text-ink-500">{site.market || '—'}</td>
                  <td className="px-4 py-3">
                    {!ccLists ? (
                      <span className="text-xs text-ink-400">Loading lists…</span>
                    ) : ccLists.length === 0 ? (
                      <span className="text-xs text-red-600">No lists available — check CC OAuth + connection</span>
                    ) : (
                      <select
                        value={current || ''}
                        onChange={e => setListFor(site.id, e.target.value)}
                        className="w-full max-w-md px-3 py-1.5 border border-ink-200 rounded text-sm bg-white"
                      >
                        <option value="">— No list —</option>
                        {ccLists.map(l => (
                          <option key={l.list_id} value={l.list_id}>
                            {l.name}{typeof l.membership_count === 'number' ? ` (${l.membership_count.toLocaleString()})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {suggestion && (
                      <button
                        onClick={() => setListFor(site.id, suggestion.list_id)}
                        className="text-[11px] text-brand-700 hover:text-brand-900 underline"
                        title={`Suggested: ${suggestion.name}`}
                      >
                        Auto-match
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-ink-500 leading-relaxed">
        <p><strong>How auto-match works:</strong> we suggest a CC list whose name contains the first word of the publication name (e.g. &ldquo;Exponent Telegram&rdquo; → a list named &ldquo;Exponent Newsletter&rdquo;). Suggestions only appear when there&apos;s no list assigned yet.</p>
        <p className="mt-1"><strong>If a publication has no list:</strong> push-to-CC still creates a draft, but the editor must pick a list inside Constant Contact before sending.</p>
      </div>
    </div>
  );
}
