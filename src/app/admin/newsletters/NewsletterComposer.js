'use client';

import { useState } from 'react';

const HOURS_OPTIONS = [
  { value: 12, label: 'Last 12 hours' },
  { value: 24, label: 'Last 24 hours' },
  { value: 48, label: 'Last 48 hours' },
  { value: 168, label: 'Last 7 days' },
];

export default function NewsletterComposer({ sites, userEmail }) {
  const [publication, setPublication] = useState('wvnews');
  const [hoursBack, setHoursBack] = useState(24);
  const [storyCount, setStoryCount] = useState(14);
  const [adCadence, setAdCadence] = useState(3);
  const [sectioned, setSectioned] = useState(true);

  const [previewHtml, setPreviewHtml] = useState('');
  const [meta, setMeta] = useState(null); // { stories, ads, generatedAt, publication }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sendStatus, setSendStatus] = useState(''); // 'idle' | 'sending' | 'sent' | 'error'
  const [sendMsg, setSendMsg] = useState('');
  const [testTo, setTestTo] = useState(userEmail || '');

  const body = {
    publication,
    hoursBack: Number(hoursBack),
    storyCount: Number(storyCount),
    adCadence: Number(adCadence),
    sectioned,
  };

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/newsletters/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setPreviewHtml(data.html);
      setMeta(data);
    } catch (err) {
      setError(err.message);
      setPreviewHtml('');
    } finally {
      setLoading(false);
    }
  }

  async function sendTest() {
    if (!testTo) { setSendStatus('error'); setSendMsg('Recipient required.'); return; }
    setSendStatus('sending');
    setSendMsg('');
    try {
      const res = await fetch('/api/newsletters/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, to: testTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSendStatus('sent');
      setSendMsg(`Sent to ${(data.sentTo || []).join(', ')} (${data.stories} stories, ${data.ads} ads).`);
    } catch (err) {
      setSendStatus('error');
      setSendMsg(err.message);
    }
  }

  async function pushToCC() {
    setSendStatus('sending');
    setSendMsg('');
    try {
      const res = await fetch('/api/newsletters/push-to-cc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const missing = data.missingEnv?.length ? ` Missing env: ${data.missingEnv.join(', ')}.` : '';
        throw new Error((data.error || `HTTP ${res.status}`) + missing);
      }
      setSendStatus('sent');
      setSendMsg('Campaign pushed to Constant Contact.');
    } catch (err) {
      setSendStatus('error');
      setSendMsg(err.message);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
      {/* Controls */}
      <div className="space-y-5">
        <section className="bg-white rounded-lg border border-ink-200 p-5">
          <h3 className="text-xs font-bold uppercase tracking-eyebrow text-ink-500 mb-3">Edition</h3>
          <label className="block">
            <span className="text-xs font-semibold text-ink-700 mb-1 block">Publication</span>
            <select
              value={publication}
              onChange={e => setPublication(e.target.value)}
              className="w-full px-3 py-2 border border-ink-200 rounded text-sm bg-white"
            >
              <option value="wvnews">WV News (all 20 papers — aggregator)</option>
              <optgroup label="Per-publication">
                {sites.filter(s => s.id !== 'wvnews').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            </select>
            <span className="text-[10px] text-ink-500 mt-1 block">
              {publication === 'wvnews'
                ? 'Pulls top stories from every paper, capped at 2 per paper for variety.'
                : 'Only stories tagged for this publication.'}
            </span>
          </label>
          <label className="block mt-3">
            <span className="text-xs font-semibold text-ink-700 mb-1 block">Content window</span>
            <select
              value={hoursBack}
              onChange={e => setHoursBack(e.target.value)}
              className="w-full px-3 py-2 border border-ink-200 rounded text-sm bg-white"
            >
              {HOURS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <label className="block">
              <span className="text-xs font-semibold text-ink-700 mb-1 block">Total stories</span>
              <input type="number" min="1" max="40" value={storyCount} onChange={e => setStoryCount(e.target.value)}
                     className="w-full px-3 py-2 border border-ink-200 rounded text-sm bg-white"/>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink-700 mb-1 block">Ad every N stories</span>
              <input type="number" min="0" max="10" value={adCadence} onChange={e => setAdCadence(e.target.value)}
                     className="w-full px-3 py-2 border border-ink-200 rounded text-sm bg-white"/>
              <span className="text-[10px] text-ink-500 mt-1 block">0 disables ads. Ads rotate from CRM if cadence outpaces inventory.</span>
            </label>
          </div>
          <label className="flex items-center gap-2 mt-3">
            <input type="checkbox" checked={sectioned} onChange={e => setSectioned(e.target.checked)} />
            <span className="text-xs text-ink-700">Group by section (News / Sports / Opinion / etc.)</span>
          </label>
          <button
            onClick={generate}
            disabled={loading}
            className="mt-4 w-full py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-800 disabled:opacity-60"
          >
            {loading ? 'Generating…' : 'Generate preview'}
          </button>
          {error && <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        </section>

        {meta && (
          <section className="bg-white rounded-lg border border-ink-200 p-5">
            <h3 className="text-xs font-bold uppercase tracking-eyebrow text-ink-500 mb-3">Selected content</h3>
            <div className="text-xs text-ink-600 space-y-3">
              <div>
                <strong className="text-ink-800">{meta.stories.length}</strong> stories ·{' '}
                <strong className="text-ink-800">{meta.ads.length}</strong> ads in pool
              </div>
              {meta.stories.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-eyebrow text-ink-500 mb-1">Top story</div>
                  <div className="font-display text-sm font-semibold text-ink-800 leading-snug">
                    {meta.stories[0].headline}
                  </div>
                  <div className="text-[10px] text-ink-500 mt-1">
                    {meta.stories[0].views > 0
                      ? `${meta.stories[0].views.toLocaleString()} views`
                      : 'no view data — picked by score'}
                    {' · '}{meta.stories[0].sites?.[0] || '?'}
                  </div>
                </div>
              )}
              {(() => {
                const buckets = {};
                meta.stories.slice(1).forEach(s => {
                  const id = s.section || 'news';
                  buckets[id] = (buckets[id] || 0) + 1;
                });
                const entries = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
                if (!entries.length) return null;
                return (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-eyebrow text-ink-500 mb-1">By section</div>
                    <ul className="space-y-1">
                      {entries.map(([id, n]) => (
                        <li key={id} className="flex justify-between">
                          <span className="capitalize">{id.replace('-', ' & ')}</span>
                          <span className="text-ink-500">{n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {previewHtml && (
          <section className="bg-white rounded-lg border border-ink-200 p-5">
            <h3 className="text-xs font-bold uppercase tracking-eyebrow text-ink-500 mb-3">Send test</h3>
            <label className="block">
              <span className="text-xs font-semibold text-ink-700 mb-1 block">To</span>
              <input
                type="email"
                value={testTo}
                onChange={e => setTestTo(e.target.value)}
                placeholder="you@wvnews.com"
                className="w-full px-3 py-2 border border-ink-200 rounded text-sm bg-white"
              />
              <span className="text-[10px] text-ink-500 mt-1 block">Comma-separate up to 5 emails.</span>
            </label>
            <button
              onClick={sendTest}
              disabled={sendStatus === 'sending'}
              className="mt-3 w-full py-2 bg-brand-100 text-brand-800 text-sm font-semibold rounded-lg hover:bg-brand-200 disabled:opacity-60"
            >
              {sendStatus === 'sending' ? 'Sending…' : 'Send test via Resend'}
            </button>
            <button
              onClick={pushToCC}
              disabled={sendStatus === 'sending'}
              className="mt-2 w-full py-2 bg-gold-500 text-brand-950 text-sm font-semibold rounded-lg hover:bg-gold-400 disabled:opacity-60"
            >
              Push to Constant Contact
            </button>
            {sendStatus === 'sent' && <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">{sendMsg}</div>}
            {sendStatus === 'error' && <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{sendMsg}</div>}
          </section>
        )}
      </div>

      {/* Preview pane */}
      <div className="bg-white rounded-lg border border-ink-200 overflow-hidden">
        <div className="border-b border-ink-200 px-4 py-2.5 flex items-center justify-between">
          <div className="text-xs text-ink-500">
            {previewHtml ? (
              <>Preview · <span className="text-ink-700 font-medium">{meta?.publication?.name}</span></>
            ) : (
              <>Preview pane — pick a publication and click Generate</>
            )}
          </div>
          {meta?.generatedAt && (
            <div className="text-[10px] text-ink-400">
              {new Date(meta.generatedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
        <div className="bg-ink-100">
          {previewHtml ? (
            <iframe
              title="Newsletter preview"
              srcDoc={previewHtml}
              className="w-full"
              style={{ height: 'calc(100vh - 220px)', minHeight: 600, border: 0, background: '#f4f4f6' }}
            />
          ) : (
            <div className="flex items-center justify-center text-center text-ink-400" style={{ minHeight: 480 }}>
              <div>
                <div className="text-5xl mb-3">✉️</div>
                <p className="text-sm">No preview yet.</p>
                <p className="text-xs mt-1">Pick a publication and content window to start.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
