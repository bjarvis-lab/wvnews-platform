// Ad placement catalog — the single source of truth for every ad slot on the
// public site. Each entry declares:
//   - desktop size list (array of [w,h] tuples GAM can fill)
//   - mobile size list (or null to hide on mobile)
//   - breakpoint (px width above which desktop sizes are used)
//   - label shown in the preview/placeholder when GAM isn't live yet
//
// To add a new placement: register it here, then drop <AdSlot placement="..." />
// wherever on the page you want it. The admin /admin/ads/placements page
// reads this catalog and shows a visual map.
//
// Sizes follow IAB Display Advertising Guidelines (2020+) with mobile-first
// defaults. Responsive sizes are defined per-placement; GPT size-mapping
// picks the right fit at render time.

export const MOBILE_BREAKPOINT = 768;

export const AD_PLACEMENTS = {
  // ─── Homepage ────────────────────────────────────────────────────────
  'home-top': {
    label: 'Homepage Top Leaderboard',
    desktop: [[728, 90], [970, 90], [970, 250]],
    mobile:  [[320, 50], [320, 100], [300, 250]],
    minHeight: { desktop: 90, mobile: 50 },
  },
  'home-sidebar-1': {
    label: 'Homepage Sidebar 1',
    desktop: [[300, 250], [300, 600]],
    mobile:  null,
    minHeight: { desktop: 250, mobile: 0 },
  },
  'home-in-feed': {
    label: 'Homepage In-Feed',
    desktop: [[728, 90], [300, 250]],
    mobile:  [[300, 250], [320, 100]],
    minHeight: { desktop: 90, mobile: 100 },
  },
  'home-sidebar-2': {
    label: 'Homepage Sidebar 2',
    desktop: [[300, 250]],
    mobile:  null,
    minHeight: { desktop: 250, mobile: 0 },
  },

  // ─── Article page ───────────────────────────────────────────────────
  'article-top': {
    label: 'Article Top Leaderboard',
    desktop: [[728, 90], [970, 90], [970, 250]],
    mobile:  [[320, 50], [320, 100]],
    minHeight: { desktop: 90, mobile: 50 },
  },
  'article-sidebar': {
    label: 'Article Sidebar',
    desktop: [[300, 250], [300, 600]],
    mobile:  null,
    minHeight: { desktop: 250, mobile: 0 },
  },
  'article-inline': {
    label: 'Article Inline (after 3rd paragraph)',
    desktop: [[300, 250], [728, 90]],
    mobile:  [[300, 250]],
    minHeight: { desktop: 250, mobile: 250 },
  },
  'article-end': {
    label: 'Article End',
    desktop: [[728, 90], [300, 250]],
    mobile:  [[300, 250]],
    minHeight: { desktop: 90, mobile: 250 },
  },
  'article-sticky-mobile': {
    label: 'Article Mobile Sticky Footer',
    desktop: null,
    mobile:  [[320, 50], [320, 100]],
    minHeight: { desktop: 0, mobile: 50 },
    sticky: true, // hint for the component to position fixed-bottom
  },

  // ─── Section listing pages ──────────────────────────────────────────
  'section-top': {
    label: 'Section Top',
    desktop: [[728, 90], [970, 90]],
    mobile:  [[320, 50], [320, 100]],
    minHeight: { desktop: 90, mobile: 50 },
  },
  'section-sidebar': {
    label: 'Section Sidebar',
    desktop: [[300, 250]],
    mobile:  null,
    minHeight: { desktop: 250, mobile: 0 },
  },
  'section-in-feed': {
    label: 'Section In-Feed',
    desktop: [[728, 90], [300, 250]],
    mobile:  [[300, 250]],
    minHeight: { desktop: 90, mobile: 250 },
  },

  // ─── Publication landing (/p/[slug]) ────────────────────────────────
  'publication-top': {
    label: 'Publication Page Top',
    desktop: [[728, 90], [970, 90]],
    mobile:  [[320, 50], [320, 100]],
    minHeight: { desktop: 90, mobile: 50 },
  },
  'publication-sidebar': {
    label: 'Publication Page Sidebar',
    desktop: [[300, 250]],
    mobile:  null,
    minHeight: { desktop: 250, mobile: 0 },
  },
};

export function getPlacement(key) {
  return AD_PLACEMENTS[key] || null;
}

// All unique sizes across the catalog — used for preview/legend.
export function allSizes() {
  const set = new Set();
  for (const p of Object.values(AD_PLACEMENTS)) {
    for (const s of (p.desktop || [])) set.add(`${s[0]}x${s[1]}`);
    for (const s of (p.mobile || []))  set.add(`${s[0]}x${s[1]}`);
  }
  return [...set].sort();
}
