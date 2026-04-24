// Google Analytics 4 config. NEXT_PUBLIC_GA4_MEASUREMENT_ID is the "G-XXXXXXX"
// you get when you create a GA4 property; exposed to the browser because
// gtag is client-side, same as GAM network id.
//
// When unset or placeholder, the script doesn't load — no pageviews get sent.
// We specifically exclude /admin/* tracking so internal traffic doesn't
// pollute public-site stats.

export const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '';
export const GA4_IS_LIVE = GA4_MEASUREMENT_ID && GA4_MEASUREMENT_ID.startsWith('G-');
