// BLOX (TownNews) Web Service v1 client.
//
// Auth: HMAC-SHA1 of (METHOD + "\n" + PATH + "\n" + sorted_query), keyed
// on BLOX_API_SECRET, base64-encoded. Sent as the `auth` query parameter
// in the form `apikey:signature`. The api key itself is also passed as
// the `apikey` parameter (it's part of the signed query string).
//
// Required env:
//   BLOX_API_BASE    e.g. https://www.wvnews.com/tncms/webservice/v1
//   BLOX_API_KEY     editorial key
//   BLOX_API_SECRET  editorial secret
//
// Endpoints we use:
//   GET /editorial/search?... — list articles by query / date / section
//   GET /editorial/get?id=... — fetch a single asset with full body + images
//
// Reference: https://help.bloxcms.com/help_topic/news/api_overview.html
// (the published HMAC pattern; if your install uses a different scheme
// the test endpoint at /api/admin/blox/test will surface the exact
// 401/403 response so we can adjust.)

import crypto from 'node:crypto';

function requireEnv() {
  const base = process.env.BLOX_API_BASE;
  const key = process.env.BLOX_API_KEY;
  const secret = process.env.BLOX_API_SECRET;
  if (!base || !key || !secret) {
    throw new Error('BLOX_API_BASE, BLOX_API_KEY, and BLOX_API_SECRET must all be set.');
  }
  return { base, key, secret };
}

// Build the "sorted query string" used both for the actual request and
// for the HMAC string-to-sign. URL-encoded with %20 for spaces (not +)
// to match BLOX's signing convention.
function sortedQuery(params) {
  return Object.keys(params)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');
}

function signBlox({ method, path, params, secret }) {
  const query = sortedQuery(params);
  // BLOX docs show string-to-sign as METHOD\nPATH\nSORTED_QUERY
  const stringToSign = `${method.toUpperCase()}\n${path}\n${query}`;
  return crypto.createHmac('sha1', secret).update(stringToSign).digest('base64');
}

// Generic request — appends apikey + auth to the query string.
async function bloxFetch(pathSegment, params = {}, { method = 'GET' } = {}) {
  const { base, key, secret } = requireEnv();

  // Normalize path — should start with /
  const baseUrl = new URL(base);
  const path = (baseUrl.pathname.replace(/\/$/, '') + (pathSegment.startsWith('/') ? pathSegment : `/${pathSegment}`));

  // Default response format unless caller overrode.
  const allParams = { f: 'json', ...params, apikey: key };
  const sig = signBlox({ method, path, params: allParams, secret });
  allParams.auth = `${key}:${sig}`;

  const url = `${baseUrl.protocol}//${baseUrl.host}${path}?${sortedQuery(allParams)}`;

  const res = await fetch(url, { method });
  const text = await res.text();
  if (!res.ok) {
    const snippet = text.slice(0, 400);
    const err = new Error(`BLOX ${method} ${path} failed: ${res.status} ${res.statusText} — ${snippet}`);
    err.status = res.status;
    err.body = text;
    err.url = url;
    throw err;
  }
  // Response may be JSON or wrapped; try to parse.
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

// ─── Public API ──────────────────────────────────────────────────────────

// Search published editorial assets. Most useful params:
//   q         — query string (free text)
//   t         — asset type (article, image, video, etc.)
//   s         — section keyword (e.g. "news", "sports")
//   l         — limit (default 20, max 200)
//   o         — offset for paging
//   sd        — sort direction (desc | asc)
//   start_time, end_time — ISO bounds
export async function searchEditorial(params = {}) {
  const data = await bloxFetch('/editorial/search', { l: 50, sd: 'desc', ...params });
  // BLOX returns assets in `assets` or sometimes top-level array.
  return data.assets || data.results || (Array.isArray(data) ? data : []);
}

// Fetch a single asset by id with the full body + images.
export async function getAsset(assetId) {
  return bloxFetch('/editorial/get', { id: assetId });
}

// Convenience: list recent articles published since `sinceIso`.
// Wraps searchEditorial with article-type + a recent window.
export async function recentArticles({ sinceIso, limit = 50 } = {}) {
  const params = { t: 'article', l: limit };
  if (sinceIso) params.start_time = sinceIso;
  return searchEditorial(params);
}

// ─── Normalization ──────────────────────────────────────────────────────

// Convert a BLOX asset into our canonical `stories` schema (see SCHEMAS.md).
// We tag with `source: 'ingested'` and `sourceUrl` pointing back at BLOX
// so reporters can trace where each story came from.
export function bloxAssetToStory(a) {
  const id = a.uuid || a.id || a.asset_id;
  const headline = a.title || a.headline || '';
  const slug = a.url || a.permalink_uri
    ? (a.url || a.permalink_uri).split('/').filter(Boolean).pop().replace(/\.[a-z0-9]+$/i, '')
    : (id || '');
  const publishedAt = a.start_time || a.published_at || a.published || null;
  const updatedAt = a.last_modified || a.updated || publishedAt;
  const body = a.content || a.body || a.description || '';
  const deck = a.subhead || a.summary || a.deck || '';

  // Image — BLOX returns child assets with their own URLs.
  let imageUrl = null;
  let imageAlt = '';
  let imageCredit = '';
  if (Array.isArray(a.children)) {
    const img = a.children.find(c => c.type === 'image' && (c.urls?.large || c.urls?.full || c.urls?.original));
    if (img) {
      imageUrl = img.urls?.large || img.urls?.full || img.urls?.original;
      imageAlt = img.title || '';
      imageCredit = img.byline || img.credit || '';
    }
  } else if (a.preview_url) {
    imageUrl = a.preview_url;
  }

  // Section — BLOX uses keyword-style section identifiers ("news", "sports").
  // Map to our canonical section ids when possible.
  const sectionRaw = (Array.isArray(a.sections) ? a.sections[0] : a.section) || '';
  const section = mapSection(sectionRaw);

  // Author — first byline if multiple.
  const authorName = Array.isArray(a.authors) ? a.authors[0]?.name : (a.byline || a.author || '');

  return {
    source: 'ingested',
    ingestSource: 'blox',
    sourceUrl: a.permalink_uri || a.url || null,
    sourcePrefix: 'wvnews',  // BLOX install owner — overrideable in caller
    slug,
    headline,
    deck,
    body,
    webBody: body,
    section,
    secondarySections: [],
    sites: ['wvnews'], // caller can override based on which BLOX install
    accessLevel: a.permissions?.public ? 'free' : (a.permissions?.subscriber ? 'premium' : 'free'),
    author: { name: authorName || '', email: '' },
    image: imageUrl ? { url: imageUrl, alt: imageAlt, credit: imageCredit } : null,
    tags: a.keywords || [],
    featured: !!a.flags?.featured,
    breaking: !!a.flags?.breaking || !!a.flags?.urgent,
    status: 'published',
    publishedAt,
    updatedAt,
    bloxId: id,
    bloxRaw: { editor: a.editor || null, type: a.type || 'article' },
  };
}

// Map BLOX section keywords to our canonical section ids in mock.js.
function mapSection(s) {
  if (!s) return 'news';
  const k = String(s).toLowerCase();
  if (k.includes('sport')) return 'sports';
  if (k.includes('opinion') || k.includes('editorial')) return 'opinion';
  if (k.includes('business')) return 'business';
  if (k.includes('crime') || k.includes('court')) return 'crime';
  if (k.includes('education') || k.includes('school')) return 'education';
  if (k.includes('lifestyle') || k.includes('feature')) return 'lifestyle';
  if (k.includes('obit')) return 'obituaries';
  if (k.includes('politic')) return 'politics';
  if (k.includes('community')) return 'community';
  return 'news';
}
