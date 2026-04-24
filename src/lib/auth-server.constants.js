// Edge-safe constants — no Node imports. Used by middleware.js which runs
// on the Edge runtime and cannot import firebase-admin.

export const SESSION_COOKIE = '__wvpp_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, seconds
