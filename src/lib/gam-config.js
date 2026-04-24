// Google Ad Manager integration config.
//
// NEXT_PUBLIC_GAM_NETWORK_ID: your GAM account's network code (e.g. 21734567890).
// Exposed to the browser because GPT is client-side; this is public by design,
// the same way Google Analytics property IDs are.
//
// When this is set to the placeholder value ("21234"), AdSlots render in a
// muted, labeled "Advertisement" box with a preview of what size will
// eventually appear there — useful during setup before GAM is wired.
//
// Ad unit path convention: `/{NETWORK_ID}/{site}/{placement}` where `site` is
// the active publication id (wvnews, exponent, dominion, etc.). Targeting
// key-values (section, tags, breaking) are passed on every request so sales
// can target campaigns without needing a separate ad unit per segment.

export const GAM_NETWORK_ID = process.env.NEXT_PUBLIC_GAM_NETWORK_ID || '21234';
export const GAM_IS_LIVE = GAM_NETWORK_ID && GAM_NETWORK_ID !== '21234';

// Default site key when a page doesn't know which publication it's on.
// Page-level overrides win (article pages pass the story's primary publication).
export const DEFAULT_SITE_KEY = 'wvnews';

export function adUnitPath(site, placement) {
  const safeSite = (site || DEFAULT_SITE_KEY).replace(/[^a-z0-9_-]/gi, '');
  const safePlacement = placement.replace(/[^a-z0-9_-]/gi, '');
  return `/${GAM_NETWORK_ID}/${safeSite}/${safePlacement}`;
}
