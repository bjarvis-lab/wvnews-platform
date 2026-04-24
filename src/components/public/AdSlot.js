'use client';
// A single GAM/GPT ad slot. Drop <AdSlot placement="article-top" /> anywhere
// and the component handles:
//   - Desktop vs mobile size selection (via GPT sizeMapping, real device width)
//   - Unique slot div id
//   - Targeting key-values (section, tags, breaking, publication)
//   - Placeholder preview when GAM isn't live yet (useful during setup)
//   - Cleanup on unmount (destroys the slot so navigation doesn't leak memory)
//
// For header bidding (Prebid.js) and lazy loading — future session.

import { useEffect, useId, useRef, useState } from 'react';
import { GAM_IS_LIVE, adUnitPath } from '@/lib/gam-config';
import { getPlacement, MOBILE_BREAKPOINT } from '@/data/ad-placements';

// Singleton — initialized once on first AdSlot mount.
let gptInitialized = false;
function initGpt() {
  if (typeof window === 'undefined') return;
  if (gptInitialized) return;
  gptInitialized = true;
  window.googletag = window.googletag || { cmd: [] };
  window.googletag.cmd.push(() => {
    window.googletag.pubads().enableSingleRequest();
    window.googletag.pubads().collapseEmptyDivs();
    window.googletag.pubads().disableInitialLoad(); // we call refresh per slot, better for SPA navigations
    window.googletag.enableServices();
  });
}

export default function AdSlot({
  placement,
  site,               // publication id — e.g. 'wvnews', 'dominion'
  targeting = {},     // { section, tags, breaking, storyId, ... }
  className = '',
  collapsedLabel = false,
}) {
  const cfg = getPlacement(placement);
  const id = useId().replace(/:/g, '_');
  const divId = `ad-${placement}-${id}`;
  const slotRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!cfg || !GAM_IS_LIVE) return;

    initGpt();

    window.googletag.cmd.push(() => {
      const path = adUnitPath(site, placement);

      // Combine every size the placement supports so GPT can serve any of them.
      const allSizes = [...(cfg.desktop || []), ...(cfg.mobile || [])];
      if (allSizes.length === 0) return;

      const slot = window.googletag.defineSlot(path, allSizes, divId);
      if (!slot) return;

      // Size mapping for responsive behavior
      const mapping = window.googletag.sizeMapping()
        .addSize([MOBILE_BREAKPOINT, 0], cfg.desktop || [])
        .addSize([0, 0], cfg.mobile || [])
        .build();
      slot.defineSizeMapping(mapping);

      // Targeting — publishable key-values for campaign targeting in GAM
      if (site) slot.setTargeting('site', site);
      for (const [k, v] of Object.entries(targeting || {})) {
        if (v == null) continue;
        slot.setTargeting(k, Array.isArray(v) ? v.map(String) : String(v));
      }

      slot.addService(window.googletag.pubads());
      slotRef.current = slot;

      window.googletag.display(divId);
      window.googletag.pubads().refresh([slot]);
    });

    return () => {
      if (!slotRef.current) return;
      const slot = slotRef.current;
      slotRef.current = null;
      if (window.googletag && window.googletag.destroySlots) {
        window.googletag.cmd.push(() => window.googletag.destroySlots([slot]));
      }
    };
    // We intentionally don't include targeting in deps — key-values are fixed per-page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, placement, site]);

  if (!cfg) {
    console.warn(`[AdSlot] Unknown placement: ${placement}`);
    return null;
  }

  // Hide on the wrong breakpoint via CSS — don't conditionally render because
  // we want the div to exist so GPT's size mapping can fill it if the user
  // rotates their device mid-session.
  const hideOnMobile = !cfg.mobile;
  const hideOnDesktop = !cfg.desktop;

  const reserveDesktop = cfg.minHeight?.desktop || 90;
  const reserveMobile  = cfg.minHeight?.mobile  || 50;
  const isSticky = !!cfg.sticky;

  return (
    <div
      className={[
        'ad-slot-wrapper',
        isSticky ? 'ad-slot-sticky' : '',
        hideOnMobile ? 'hidden md:block' : '',
        hideOnDesktop ? 'md:hidden' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={isSticky ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40 } : undefined}
    >
      {!collapsedLabel && (
        <div className="text-[10px] uppercase tracking-widest text-ink-400 text-center py-0.5">
          Advertisement
        </div>
      )}
      <div
        id={divId}
        className="mx-auto bg-ink-50 border border-ink-100 overflow-hidden"
        style={{
          minHeight: `${reserveMobile}px`,
          // Desktop reservation — using CSS var so we don't fight breakpoints
        }}
        data-desktop-height={reserveDesktop}
      >
        {/* Preview when GAM isn't live: show the primary size */}
        {mounted && !GAM_IS_LIVE && (
          <div className="w-full h-full flex items-center justify-center text-ink-400 text-xs" style={{ minHeight: reserveDesktop, padding: '16px 8px' }}>
            {cfg.label} · {(cfg.desktop?.[0] || cfg.mobile?.[0] || []).join('×') || '—'}
          </div>
        )}
      </div>
      <style jsx>{`
        @media (min-width: ${MOBILE_BREAKPOINT}px) {
          div[id="${divId}"] {
            min-height: ${reserveDesktop}px !important;
          }
        }
      `}</style>
    </div>
  );
}
