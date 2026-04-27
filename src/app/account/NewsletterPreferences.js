'use client';
// Live newsletter preferences for the signed-in reader. Pulls the
// publication ↔ Constant Contact list mapping + the reader's actual
// memberships, renders one checkbox per publication that has a list,
// and PUTs the selection back to /api/account/subscriptions on save.
//
// Publications without a CC list mapped (admin hasn't assigned one
// yet) show a "not yet available" indicator so the reader doesn't
// assume the toggle is broken.

import { useEffect, useState } from 'react';

export default function NewsletterPreferences() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState(new Set()); // mid-toggle indicator
  const [saveStatus, setSaveStatus] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/account/subscriptions', { cache: 'no-store' });
        const body = await res.json();
        if (!cancelled) {
          if (!res.ok) setError(body.error || `HTTP ${res.status}`);
          else setData(body);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function toggle(pubId) {
    setData(d => {
      if (!d) return d;
      return {
        ...d,
        publications: d.publications.map(p =>
          p.id === pubId ? { ...p, subscribed: !p.subscribed } : p
        ),
      };
    });
  }

  async function save() {
    if (!data) return;
    setSaveStatus('saving');
    setSaveMsg('');
    const subscribedPublications = data.publications.filter(p => p.subscribed && p.subscribable).map(p => p.id);
    try {
      const res = await fetch('/api/account/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribedPublications }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setSaveStatus('saved');
      setSaveMsg('Preferences saved.');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setSaveStatus('error');
      setSaveMsg(err.message);
    }
  }

  if (loading) return <div className="text-sm text-ink-500">Loading your subscriptions…</div>;
  if (error) return (
    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-3">
      {error}
    </div>
  );

  if (!data) return null;

  const subscribable = data.publications.filter(p => p.subscribable);
  const unavailable = data.publications.filter(p => !p.subscribable);
  const subCount = subscribable.filter(p => p.subscribed).length;

  return (
    <div className="space-y-4">
      <div className="text-sm text-ink-700">
        Choose which WV News newsletters you&apos;d like to receive.
        {' '}You&apos;re currently signed up for <strong>{subCount}</strong> of {subscribable.length}.
      </div>

      <div className="divide-y divide-ink-100 border border-ink-200 rounded-lg bg-white">
        {subscribable.map(p => (
          <label key={p.id} className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-ink-50/50">
            <div>
              <div className="text-sm font-medium text-ink-800">{p.name}</div>
              {p.market && <div className="text-xs text-ink-500">{p.market}</div>}
            </div>
            <input
              type="checkbox"
              checked={!!p.subscribed}
              onChange={() => toggle(p.id)}
              className="w-5 h-5 rounded"
            />
          </label>
        ))}
      </div>

      {unavailable.length > 0 && (
        <div className="text-xs text-ink-500">
          <div className="font-semibold mb-1">Coming soon:</div>
          <ul className="space-y-0.5">
            {unavailable.map(p => <li key={p.id}>· {p.name}</li>)}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saveStatus === 'saving'}
          className="px-4 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-800 disabled:opacity-60"
        >
          {saveStatus === 'saving' ? 'Saving…' : 'Save preferences'}
        </button>
        {saveStatus === 'saved' && <span className="text-xs text-green-700">{saveMsg}</span>}
        {saveStatus === 'error' && <span className="text-xs text-red-700">{saveMsg}</span>}
      </div>
    </div>
  );
}
