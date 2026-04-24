// Admin — GAM placement inventory. Shows every registered ad slot with its
// desktop + mobile sizes, label, and the ad unit path the site will request
// from GAM. Read-only for now; editable config lives in
// src/data/ad-placements.js. A future version will let admins toggle each
// placement on/off per-publication and override sizes from this page.

import Link from 'next/link';
import { AD_PLACEMENTS, allSizes } from '@/data/ad-placements';
import { GAM_NETWORK_ID, GAM_IS_LIVE, adUnitPath } from '@/lib/gam-config';

export const dynamic = 'force-dynamic';

export default function PlacementsPage() {
  const entries = Object.entries(AD_PLACEMENTS);

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900">Ad Placements</h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Every slot wired into the public pages. Sizes, paths, and targeting are read live by the AdSlot component.
          </p>
        </div>
      </div>

      {/* GAM connection status */}
      <div className={`rounded-xl p-4 border ${GAM_IS_LIVE ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{GAM_IS_LIVE ? '🟢' : '🟡'}</span>
          <span className="font-semibold text-ink-900">
            {GAM_IS_LIVE ? `GAM connected — network ${GAM_NETWORK_ID}` : 'GAM not yet connected — placements render in preview mode'}
          </span>
        </div>
        {!GAM_IS_LIVE && (
          <p className="text-xs text-ink-700">
            Set <code className="px-1 bg-white rounded">NEXT_PUBLIC_GAM_NETWORK_ID</code> in Vercel + .env.local to your GAM network code.
            Until then, public pages show labeled preview placeholders at the exact position and reserved height each ad will take.
          </p>
        )}
      </div>

      {/* Inventory table */}
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/70 border-b border-ink-100 text-xs font-semibold text-ink-600 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left">Placement</th>
              <th className="px-5 py-3 text-left">Desktop sizes</th>
              <th className="px-5 py-3 text-left">Mobile sizes</th>
              <th className="px-5 py-3 text-left">Example GAM path</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {entries.map(([key, p]) => (
              <tr key={key} className="hover:bg-ink-50/40">
                <td className="px-5 py-4">
                  <div className="font-semibold text-ink-900">{p.label}</div>
                  <code className="text-[11px] text-ink-500 font-mono">{key}</code>
                </td>
                <td className="px-5 py-4 text-ink-700 text-xs">
                  {p.desktop?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {p.desktop.map(([w, h]) => (
                        <span key={`${w}x${h}`} className="px-1.5 py-0.5 bg-ink-100 rounded font-mono">{w}×{h}</span>
                      ))}
                    </div>
                  ) : <span className="text-ink-400">hidden</span>}
                </td>
                <td className="px-5 py-4 text-ink-700 text-xs">
                  {p.mobile?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {p.mobile.map(([w, h]) => (
                        <span key={`${w}x${h}`} className="px-1.5 py-0.5 bg-ink-100 rounded font-mono">{w}×{h}</span>
                      ))}
                    </div>
                  ) : <span className="text-ink-400">hidden</span>}
                  {p.sticky && <div className="text-[10px] text-gold-700 font-semibold mt-1">⚓ sticky footer</div>}
                </td>
                <td className="px-5 py-4 text-[11px] text-ink-600 font-mono">{adUnitPath('wvnews', key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-ink-200 p-5">
        <h3 className="font-display text-lg font-bold text-ink-900 mb-2">Sizes used across all placements</h3>
        <div className="flex flex-wrap gap-2">
          {allSizes().map(s => (
            <span key={s} className="px-2 py-1 bg-ink-100 rounded text-xs font-mono">{s}</span>
          ))}
        </div>
        <p className="text-xs text-ink-500 mt-3">
          Create corresponding ad units in GAM under your network. Targeting key-values passed on every request:{' '}
          <code className="bg-ink-100 px-1 rounded">site</code>,{' '}
          <code className="bg-ink-100 px-1 rounded">page</code>,{' '}
          <code className="bg-ink-100 px-1 rounded">section</code>,{' '}
          <code className="bg-ink-100 px-1 rounded">tags</code>,{' '}
          <code className="bg-ink-100 px-1 rounded">breaking</code>,{' '}
          <code className="bg-ink-100 px-1 rounded">access</code>,{' '}
          <code className="bg-ink-100 px-1 rounded">storyId</code>,{' '}
          <code className="bg-ink-100 px-1 rounded">publication</code>.
        </p>
      </div>

      <div>
        <Link href="/admin/ads" className="text-sm text-brand-700 hover:underline">
          ← Back to ad queue
        </Link>
      </div>
    </div>
  );
}
