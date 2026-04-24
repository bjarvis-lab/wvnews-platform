'use client';
// Rate card editor. Shows each self-serve product as a card; admins flip
// enable toggles, edit base price, tweak add-ons, and hit Save. Sends the
// whole pricing object back to the server action as a single JSON payload.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { savePricingAction } from './actions';

export default function PricingEditor({ initial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  function update(path, value) {
    setForm(prev => {
      const next = structuredClone(prev);
      const parts = path.split('.');
      let cursor = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cursor = cursor[parts[i]];
      }
      cursor[parts[parts.length - 1]] = value;
      return next;
    });
    setSaved(false);
  }

  function save() {
    setError(null);
    const fd = new FormData();
    fd.set('pricing', JSON.stringify(form));
    startTransition(async () => {
      try {
        const res = await savePricingAction(fd);
        if (res?.ok) {
          setSaved(true);
          router.refresh();
          setTimeout(() => setSaved(false), 3000);
        }
      } catch (e) {
        setError(e.message || 'Save failed');
      }
    });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900">Self-Serve Pricing</h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Edit rates for obits, classifieds, legals, and announcements. Public forms read this live.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-emerald-700 font-semibold">✓ Saved</span>}
          <button
            onClick={save}
            disabled={pending}
            className="px-5 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save Rate Card'}
          </button>
        </div>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg">{error}</div>}

      {/* Obituary */}
      <ProductCard title="Obituaries" icon="🕊️" enabled={form.obituary.enabled} onToggle={v => update('obituary.enabled', v)}>
        <Row label="Base price">
          <MoneyInput value={form.obituary.basePrice} onChange={v => update('obituary.basePrice', v)} />
        </Row>
        <Row label="Description">
          <input value={form.obituary.description} onChange={e => update('obituary.description', e.target.value)} className="input" />
        </Row>
        <Row label="Notes (shown to submitter)">
          <textarea rows={2} value={form.obituary.notes || ''} onChange={e => update('obituary.notes', e.target.value)} className="input" />
        </Row>
        <AddOnsEditor addOns={form.obituary.addOns} path="obituary.addOns" update={update} />
      </ProductCard>

      {/* Classified */}
      <ProductCard title="Classifieds" icon="📰" enabled={form.classified.enabled} onToggle={v => update('classified.enabled', v)}>
        <Row label="Base price (4 lines / 1 week)">
          <MoneyInput value={form.classified.basePrice} onChange={v => update('classified.basePrice', v)} />
        </Row>
        <Row label="Description">
          <input value={form.classified.description} onChange={e => update('classified.description', e.target.value)} className="input" />
        </Row>
        <Row label="Categories (comma-separated)">
          <input
            value={(form.classified.categories || []).join(', ')}
            onChange={e => update('classified.categories', e.target.value.split(',').map(x => x.trim()).filter(Boolean))}
            className="input"
          />
        </Row>
        <AddOnsEditor addOns={form.classified.addOns} path="classified.addOns" update={update} />
      </ProductCard>

      {/* Legal */}
      <ProductCard title="Legal Notices" icon="⚖️" enabled={form.legal.enabled} onToggle={v => update('legal.enabled', v)}>
        <div className="grid grid-cols-2 gap-4">
          <Row label="Per-line price">
            <MoneyInput value={form.legal.perLinePrice} onChange={v => update('legal.perLinePrice', v)} step="0.25" />
          </Row>
          <Row label="Minimum lines">
            <input type="number" value={form.legal.minimumLines} onChange={e => update('legal.minimumLines', Number(e.target.value))} className="input" />
          </Row>
        </div>
        <Row label="Description">
          <input value={form.legal.description} onChange={e => update('legal.description', e.target.value)} className="input" />
        </Row>
        <Row label="Notes">
          <textarea rows={2} value={form.legal.notes || ''} onChange={e => update('legal.notes', e.target.value)} className="input" />
        </Row>
        <AddOnsEditor addOns={form.legal.addOns} path="legal.addOns" update={update} />
      </ProductCard>

      {/* Announcements */}
      <ProductCard title="Announcements" icon="🎉" enabled={form.announcement.enabled} onToggle={v => update('announcement.enabled', v)}>
        <div className="space-y-3">
          <div className="text-xs font-semibold text-ink-600 uppercase tracking-wider">Types + base prices</div>
          {Object.entries(form.announcement.types).map(([key, t]) => (
            <div key={key} className="grid grid-cols-[120px_100px_1fr] gap-3 items-center">
              <div className="text-sm font-semibold text-ink-800">{t.label}</div>
              <MoneyInput value={t.price} onChange={v => update(`announcement.types.${key}.price`, v)} />
              <input value={t.description} onChange={e => update(`announcement.types.${key}.description`, e.target.value)} className="input" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <AddOnsEditor addOns={form.announcement.addOns} path="announcement.addOns" update={update} />
        </div>
      </ProductCard>

      {/* Free-form modules — just toggles */}
      <ProductCard title="Free-to-submit modules" icon="📬" enabled={true} hideToggle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'newsTip',     label: 'News tips' },
            { key: 'letter',      label: 'Letters to editor' },
            { key: 'event',       label: 'Community events' },
            { key: 'advertise',   label: 'Advertise inquiry (lead form)' },
            { key: 'sportsScore', label: 'Sports scores from coaches' },
            { key: 'photo',       label: 'Reader photo submissions' },
          ].map(m => (
            <label key={m.key} className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg">
              <input
                type="checkbox"
                checked={!!form[m.key]?.enabled}
                onChange={e => update(`${m.key}.enabled`, e.target.checked)}
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink-900">{m.label}</div>
                <input
                  value={form[m.key]?.description || ''}
                  onChange={e => update(`${m.key}.description`, e.target.value)}
                  className="mt-1 w-full px-2 py-1 text-xs bg-white border border-ink-200 rounded"
                  placeholder="Shown to user on the submit page"
                />
              </div>
            </label>
          ))}
        </div>
      </ProductCard>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          outline: none;
        }
        :global(.input:focus) {
          border-color: #4263eb;
          box-shadow: 0 0 0 2px rgba(66, 99, 235, 0.2);
        }
      `}</style>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function ProductCard({ title, icon, enabled, onToggle, hideToggle, children }) {
  return (
    <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
      <div className={`px-5 py-4 border-b border-ink-100 flex items-center justify-between ${enabled ? 'bg-white' : 'bg-ink-50/70'}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-display text-lg font-bold text-ink-900">{title}</h3>
          {!enabled && !hideToggle && <span className="text-xs text-ink-500">(disabled — form hidden from public)</span>}
        </div>
        {!hideToggle && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!enabled} onChange={e => onToggle(e.target.checked)} />
            Enabled
          </label>
        )}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}

function MoneyInput({ value, onChange, step = '1' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-2 text-sm text-ink-500">$</span>
      <input
        type="number"
        value={value ?? 0}
        step={step}
        min="0"
        onChange={e => onChange(Number(e.target.value))}
        className="input pl-7"
      />
    </div>
  );
}

function AddOnsEditor({ addOns, path, update }) {
  if (!addOns) return null;
  return (
    <div className="pt-3 border-t border-ink-100">
      <div className="text-xs font-semibold text-ink-600 uppercase tracking-wider mb-2">Add-ons</div>
      <div className="space-y-2">
        {Object.entries(addOns).map(([key, a]) => (
          <div key={key} className="grid grid-cols-[1fr_100px] gap-3 items-center">
            <input
              value={a.label}
              onChange={e => update(`${path}.${key}.label`, e.target.value)}
              className="input text-sm"
            />
            <MoneyInput value={a.price} onChange={v => update(`${path}.${key}.price`, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}
