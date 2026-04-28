'use client';

import { useEffect, useRef, useState } from 'react';

const SIDEBAR_TOGGLES = [
  { key: 'showWeather', label: 'Weather widget', desc: 'Local forecast in the right rail' },
  { key: 'showNewsletter', label: 'Newsletter signup', desc: 'Email capture box in the right rail' },
  { key: 'showMostRead', label: 'Most read', desc: 'Top-5 stories by traffic in the right rail' },
  { key: 'showReaderServices', label: 'Reader services', desc: 'Links to obituary/letter/tip submission forms' },
];

export default function SiteSettingsClient({ sites, sections, initialSiteId, initialSettings }) {
  const [siteId, setSiteId] = useState(initialSiteId);
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  // Reload when site changes.
  useEffect(() => {
    if (siteId === initialSiteId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/site-settings?site=${encodeURIComponent(siteId)}`, { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && res.ok) setSettings(data.settings);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [siteId, initialSiteId]);

  function setMasthead(key, value) {
    setSettings(s => ({ ...s, masthead: { ...s.masthead, [key]: value } }));
  }
  function setSidebar(key, value) {
    setSettings(s => ({ ...s, sidebar: { ...s.sidebar, [key]: value } }));
  }
  function moveFeatured(idx, dir) {
    setSettings(s => {
      const next = [...s.featuredSections];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return s;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return { ...s, featuredSections: next };
    });
  }
  function removeFeatured(id) {
    setSettings(s => ({ ...s, featuredSections: s.featuredSections.filter(x => x !== id) }));
  }
  function addFeatured(id) {
    setSettings(s => s.featuredSections.includes(id)
      ? s
      : { ...s, featuredSections: [...s.featuredSections, id] });
  }

  async function uploadMasthead(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('site', siteId);
      const res = await fetch('/api/layout/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMasthead('imageUrl', data.url);
      if (!settings.masthead.altText) setMasthead('altText', f.name.replace(/\.[a-z0-9]+$/i, ''));
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function save() {
    setSaving(true);
    setSaveStatus('');
    setSaveMsg('');
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: siteId, settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSaveStatus('saved');
      setSaveMsg('Saved. Reload the homepage to see the change.');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setSaveStatus('error');
      setSaveMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  const featuredIds = new Set(settings.featuredSections);
  const otherSections = sections.filter(s => !featuredIds.has(s.id));

  return (
    <div className="space-y-5">
      {/* Site picker + save */}
      <div className="bg-white rounded-lg border border-ink-200 p-4 flex items-center gap-3">
        <label className="text-xs font-semibold text-ink-700">Editing</label>
        <select value={siteId} onChange={e => setSiteId(e.target.value)}
                className="px-3 py-1.5 border border-ink-200 rounded text-sm bg-white">
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {loading && <span className="text-xs text-ink-500">Loading…</span>}
        <div className="flex-1" />
        {saveStatus === 'saved' && <span className="text-xs text-green-700">{saveMsg}</span>}
        {saveStatus === 'error' && <span className="text-xs text-red-700">{saveMsg}</span>}
        <button onClick={save} disabled={saving}
                className="px-4 py-2 text-sm font-semibold bg-brand-700 text-white rounded-lg hover:bg-brand-800 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Masthead */}
        <section className="bg-white rounded-lg border border-ink-200 p-5 lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-eyebrow text-ink-500 mb-3">Masthead banner</h3>
          <p className="text-xs text-ink-500 mb-3">Optional image rendered at the top of the homepage. Leave empty to use the standard logo header.</p>
          {settings.masthead.imageUrl ? (
            <div className="space-y-3">
              <div className="rounded border border-ink-200 bg-ink-50 p-3" style={{ background: settings.masthead.bgColor || '#f8f9fa' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={settings.masthead.imageUrl} alt={settings.masthead.altText || ''} className="block max-w-full h-auto mx-auto" />
              </div>
              <div className="flex gap-3 text-xs">
                <button onClick={() => fileRef.current?.click()} className="text-brand-700 hover:underline">Replace image</button>
                <button onClick={() => setMasthead('imageUrl', '')} className="text-red-600 hover:underline">Remove</button>
              </div>
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()}
                 className="border-2 border-dashed border-ink-300 rounded-lg p-8 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/30">
              <div className="text-3xl mb-1">📤</div>
              <div className="text-sm text-ink-700 font-medium">Click to upload</div>
              <div className="text-xs text-ink-500 mt-1">PNG, JPG, or SVG up to 25 MB</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadMasthead} className="hidden" />
          {uploading && <div className="text-xs text-ink-500 mt-2">Uploading…</div>}
          {uploadError && <div className="text-xs text-red-600 mt-2">{uploadError}</div>}

          {settings.masthead.imageUrl && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <label className="block">
                <span className="text-[10px] font-bold text-ink-500 uppercase tracking-eyebrow block mb-1">Alt text</span>
                <input value={settings.masthead.altText || ''} onChange={e => setMasthead('altText', e.target.value)}
                       placeholder="Holiday parade banner" className="w-full px-3 py-1.5 border border-ink-200 rounded text-sm" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold text-ink-500 uppercase tracking-eyebrow block mb-1">Link target</span>
                <input value={settings.masthead.linkUrl || ''} onChange={e => setMasthead('linkUrl', e.target.value)}
                       placeholder="/contests/holiday-parade" className="w-full px-3 py-1.5 border border-ink-200 rounded text-sm" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-[10px] font-bold text-ink-500 uppercase tracking-eyebrow block mb-1">Background color (optional)</span>
                <input value={settings.masthead.bgColor || ''} onChange={e => setMasthead('bgColor', e.target.value)}
                       placeholder="#0f1d3d, transparent, or empty" className="w-full px-3 py-1.5 border border-ink-200 rounded text-sm font-mono" />
              </label>
            </div>
          )}
        </section>

        {/* Sidebar toggles */}
        <section className="bg-white rounded-lg border border-ink-200 p-5">
          <h3 className="text-xs font-bold uppercase tracking-eyebrow text-ink-500 mb-3">Right rail</h3>
          <div className="space-y-3">
            {SIDEBAR_TOGGLES.map(t => (
              <label key={t.key} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!settings.sidebar[t.key]}
                  onChange={e => setSidebar(t.key, e.target.checked)}
                  className="mt-0.5 w-4 h-4"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink-800">{t.label}</div>
                  <div className="text-xs text-ink-500">{t.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* Featured sections */}
      <section className="bg-white rounded-lg border border-ink-200 p-5">
        <h3 className="text-xs font-bold uppercase tracking-eyebrow text-ink-500 mb-3">Featured sections</h3>
        <p className="text-xs text-ink-500 mb-4">Pick which sections get a dedicated block on the homepage and in what order.</p>

        <div className="space-y-1.5 mb-4">
          {settings.featuredSections.length === 0 && (
            <div className="text-xs text-ink-500 italic">No sections featured. Pick from below to add.</div>
          )}
          {settings.featuredSections.map((id, idx) => {
            const sec = sections.find(s => s.id === id);
            return (
              <div key={id} className="flex items-center gap-3 p-2.5 bg-ink-50 border border-ink-200 rounded">
                <span className="text-lg">{sec?.icon || '📁'}</span>
                <span className="flex-1 text-sm font-medium text-ink-800">{sec?.name || id}</span>
                <button onClick={() => moveFeatured(idx, -1)} disabled={idx === 0}
                        className="w-6 h-6 rounded bg-white border border-ink-200 hover:bg-ink-100 disabled:opacity-30 text-xs">↑</button>
                <button onClick={() => moveFeatured(idx, +1)} disabled={idx === settings.featuredSections.length - 1}
                        className="w-6 h-6 rounded bg-white border border-ink-200 hover:bg-ink-100 disabled:opacity-30 text-xs">↓</button>
                <button onClick={() => removeFeatured(id)} className="w-6 h-6 rounded bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs">✕</button>
              </div>
            );
          })}
        </div>

        {otherSections.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-eyebrow text-ink-500 mb-2">Add a section</div>
            <div className="flex flex-wrap gap-2">
              {otherSections.map(s => (
                <button key={s.id} onClick={() => addFeatured(s.id)}
                        className="px-3 py-1.5 text-xs font-medium text-ink-700 bg-white border border-ink-200 rounded hover:bg-brand-50 hover:border-brand-300">
                  {s.icon} {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
