// BLOX → Firestore stories ingest. Pulls recent published articles from
// the BLOX Web Service (full body + images + metadata) and upserts them
// into the `stories` collection with source='ingested', ingestSource='blox'.
//
// Differences from ingest-wvnews.mjs (the RSS scraper):
//   - Full article bodies (RSS only had titles + summaries)
//   - Images at multiple resolutions
//   - Real section keywords (RSS only had pubdate)
//   - Per-asset paywall flags
//
// Usage:
//   set -a && source .env.local && set +a && \
//     GOOGLE_APPLICATION_CREDENTIALS=~/secrets/wvnews-crm-sa.json \
//     node scripts/ingest-blox.mjs [--since=ISO] [--limit=200]

import crypto from 'node:crypto';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// ─── Args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const argMap = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const sinceIso = argMap.since || new Date(Date.now() - 24 * 3600_000).toISOString();
const limit = Math.min(Number(argMap.limit || 200), 500);

// ─── Firebase ───────────────────────────────────────────────────────────
if (!getApps().length) {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const credential = inline
    ? cert(typeof inline === 'string' ? JSON.parse(inline) : inline)
    : applicationDefault();
  initializeApp({ credential, projectId: process.env.FIREBASE_PROJECT_ID || 'wvnews-crm' });
}
const db = getFirestore();

// ─── BLOX client (inline since this is a standalone script) ─────────────
const BLOX_BASE = process.env.BLOX_API_BASE;
const BLOX_KEY  = process.env.BLOX_API_KEY;
const BLOX_SEC  = process.env.BLOX_API_SECRET;
if (!BLOX_BASE || !BLOX_KEY || !BLOX_SEC) {
  console.error('BLOX_API_BASE, BLOX_API_KEY, BLOX_API_SECRET must all be set.');
  process.exit(1);
}

function sortedQuery(p) {
  return Object.keys(p).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(p[k])}`)
    .join('&');
}

async function bloxFetch(pathSegment, params = {}) {
  const baseUrl = new URL(BLOX_BASE);
  const path = baseUrl.pathname.replace(/\/$/, '') + (pathSegment.startsWith('/') ? pathSegment : `/${pathSegment}`);
  const allParams = { f: 'json', ...params, apikey: BLOX_KEY };
  const stringToSign = `GET\n${path}\n${sortedQuery(allParams)}`;
  const sig = crypto.createHmac('sha1', BLOX_SEC).update(stringToSign).digest('base64');
  allParams.auth = `${BLOX_KEY}:${sig}`;
  const url = `${baseUrl.protocol}//${baseUrl.host}${path}?${sortedQuery(allParams)}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`BLOX ${res.status}: ${text.slice(0, 300)}`);
  }
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

// ─── Normalization (mirrors lib/blox-client.js) ─────────────────────────
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

function normalize(a) {
  const id = a.uuid || a.id || a.asset_id;
  const headline = a.title || a.headline || '';
  const sourceUrl = a.permalink_uri || a.url || null;
  const slug = sourceUrl
    ? sourceUrl.split('/').filter(Boolean).pop().replace(/\.[a-z0-9]+$/i, '').slice(0, 100)
    : (id ? String(id).slice(0, 80) : null);
  const body = a.content || a.body || a.description || '';
  const deck = a.subhead || a.summary || a.deck || '';
  const publishedAt = a.start_time || a.published_at || a.published || null;
  const updatedAt = a.last_modified || a.updated || publishedAt;

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

  const sectionRaw = (Array.isArray(a.sections) ? a.sections[0] : a.section) || '';
  const authorName = Array.isArray(a.authors) ? a.authors[0]?.name : (a.byline || a.author || '');

  return {
    id,
    slug,
    headline,
    deck,
    body,
    webBody: body,
    section: mapSection(sectionRaw),
    secondarySections: [],
    sites: ['wvnews'],
    accessLevel: a.permissions?.public ? 'free' : (a.permissions?.subscriber ? 'premium' : 'free'),
    author: { name: authorName || '', email: '' },
    image: imageUrl ? { url: imageUrl, alt: imageAlt, credit: imageCredit } : null,
    tags: Array.isArray(a.keywords) ? a.keywords : [],
    featured: !!a.flags?.featured,
    breaking: !!a.flags?.breaking || !!a.flags?.urgent,
    status: 'published',
    source: 'ingested',
    ingestSource: 'blox',
    sourceUrl,
    sourcePrefix: 'wvnews',
    bloxId: id,
    publishedAt: publishedAt ? Timestamp.fromDate(new Date(publishedAt)) : null,
    updatedAt: updatedAt ? Timestamp.fromDate(new Date(updatedAt)) : Timestamp.now(),
  };
}

// ─── Run ────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[blox] pulling articles since ${sinceIso}, limit ${limit}`);

  let assets;
  try {
    assets = await bloxFetch('/editorial/search', {
      t: 'article',
      l: limit,
      sd: 'desc',
      start_time: sinceIso,
    });
    if (!Array.isArray(assets)) assets = assets.assets || assets.results || [];
  } catch (err) {
    console.error('[blox] fetch failed:', err.message);
    process.exit(1);
  }
  console.log(`[blox] received ${assets.length} assets`);

  if (!assets.length) {
    console.log('[blox] nothing to ingest, exiting');
    return;
  }

  // Upsert in batches of 400 (Firestore batch limit is 500).
  let written = 0;
  let skipped = 0;
  for (let i = 0; i < assets.length; i += 400) {
    const batch = db.batch();
    const chunk = assets.slice(i, i + 400);
    for (const asset of chunk) {
      const story = normalize(asset);
      if (!story.headline || !story.id) { skipped++; continue; }
      // Doc id pattern: blox-{id}. Stable so reruns upsert.
      const docId = `blox-${String(story.id).replace(/[^\w-]/g, '_').slice(0, 90)}`;
      const ref = db.collection('stories').doc(docId);
      batch.set(ref, story, { merge: true });
      written++;
    }
    await batch.commit();
    console.log(`  wrote ${Math.min(i + 400, assets.length)}/${assets.length}`);
  }

  // Stats so the Media Desk can show last-collected.
  await db.collection('mediaDeskStats').doc('latestBlox').set({
    runAt: Timestamp.now(),
    totalItems: written,
    skipped,
    sinceIso,
  }, { merge: false });

  console.log(`[blox] done: ${written} written, ${skipped} skipped`);
}

main().catch(err => {
  console.error('[blox] fatal:', err);
  process.exit(1);
});
