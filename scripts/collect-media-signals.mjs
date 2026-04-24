// Pulls RSS feeds from every registered WV source + Google News queries,
// writes each item to the `mediaSignals` Firestore collection. Safe to rerun
// — each signal is upserted by URL so duplicates just bump lastSeenAt + count.
//
// Run: node scripts/collect-media-signals.mjs
// Schedule: GitHub Actions every 15 min (see .github/workflows/).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UA = 'Mozilla/5.0 (wvnews-platform media-desk-collector)';

// Dynamic imports so we can require() firebase-admin conditionally.
async function loadFirestore() {
  const { initializeApp, applicationDefault, cert, getApps } = await import('firebase-admin/app');
  const { getFirestore, Timestamp, FieldValue } = await import('firebase-admin/firestore');

  if (!getApps().length) {
    const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const credential = inline
      ? cert(typeof inline === 'string' ? JSON.parse(inline) : inline)
      : applicationDefault();
    initializeApp({ credential, projectId: process.env.FIREBASE_PROJECT_ID || 'wvnews-crm' });
  }
  return { db: getFirestore(), Timestamp, FieldValue };
}

async function loadSources() {
  // Inline parse of the JS-module file — we avoid a full build dep chain.
  // Simpler path: dynamic import with a ?url=... hack. Since we're in ESM,
  // a direct import works.
  const mod = await import(new URL('../src/data/media-sources.js', import.meta.url));
  return mod;
}

// ─── XML parsing (no deps) ──────────────────────────────────────────────
function extractAll(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  return [...xml.matchAll(re)].map(m => m[1]);
}
function extract(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1] : '';
}
function extractAttr(xml, tag, attr) {
  const m = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`, 'i'));
  return m ? m[1] : '';
}
function decode(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&apos;/g, "'")
    .replace(/&#8230;/g, '…').replace(/&#39;/g, "'").replace(/&#8217;/g, '’')
    .replace(/<[^>]+>/g, '') // strip inner tags for plain text fields
    .trim();
}

// Parse a standard RSS 2.0 or Atom feed. Returns an array of { title, link,
// description, pubDate, author, sourceDomain } — whichever fields are present.
// Google News RSS items embed the original outlet as <source url="...">Name</source>,
// which we use downstream for clustering uniqueness.
function parseFeed(xml) {
  const items = extractAll(xml, 'item').concat(extractAll(xml, 'entry'));
  return items.map(raw => {
    let link = decode(extract(raw, 'link'));
    if (!link || link.startsWith('<')) link = extractAttr(raw, 'link', 'href');

    const sourceUrl = extractAttr(raw, 'source', 'url');
    const sourceName = decode(extract(raw, 'source'));
    let sourceDomain = null;
    try { if (sourceUrl) sourceDomain = new URL(sourceUrl).hostname.replace(/^www\./, ''); } catch {}

    return {
      title:       decode(extract(raw, 'title')),
      link,
      description: decode(extract(raw, 'description') || extract(raw, 'summary')),
      pubDate:     decode(extract(raw, 'pubDate') || extract(raw, 'published') || extract(raw, 'updated')),
      author:      decode(extract(raw, 'dc:creator') || extract(raw, 'author')),
      imageUrl:    extractAttr(raw, 'enclosure', 'url') || extractAttr(raw, 'media:content', 'url') || extractAttr(raw, 'media:thumbnail', 'url'),
      sourceUrl,
      sourceName,   // e.g. "WOWK-TV" from a Google News item
      sourceDomain, // e.g. "wowktv.com"
    };
  }).filter(it => it.title && it.link);
}

async function fetchWithTimeout(url, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally { clearTimeout(t); }
}

// ─── Collectors ─────────────────────────────────────────────────────────
async function collectRssSources(sources, upsert) {
  const results = { attempted: 0, succeeded: 0, failed: 0, itemsIngested: 0, byKind: {} };
  await Promise.all(sources.map(async (s) => {
    if (!s.rss) return;
    results.attempted++;
    try {
      const xml = await fetchWithTimeout(s.rss);
      const items = parseFeed(xml);
      for (const item of items.slice(0, 25)) {
        await upsert({
          url: item.link,
          title: item.title,
          summary: item.description?.slice(0, 400) || '',
          publishedAt: item.pubDate || null,
          imageUrl: item.imageUrl || null,
          author: item.author || null,
          sourceId: s.id,
          sourceName: s.name,
          kind: s.kind,
          domain: s.domain,
          origin: 'rss',
        });
        results.itemsIngested++;
      }
      results.succeeded++;
      results.byKind[s.kind] = (results.byKind[s.kind] || 0) + items.length;
    } catch (err) {
      console.warn(`[rss] ${s.id}: ${err.message}`);
      results.failed++;
    }
  }));
  return results;
}

async function collectGoogleNews(queries, upsert) {
  const results = { attempted: 0, succeeded: 0, failed: 0, itemsIngested: 0, byTopic: {} };
  await Promise.all(queries.map(async (q) => {
    results.attempted++;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q.query)}&hl=en-US&gl=US&ceid=US:en`;
    try {
      const xml = await fetchWithTimeout(url);
      const items = parseFeed(xml);
      for (const item of items.slice(0, 10)) {
        await upsert({
          url: item.link,
          title: item.title,
          summary: item.description?.slice(0, 400) || '',
          publishedAt: item.pubDate || null,
          // Prefer the actual publisher Google News identifies (e.g. wowktv.com)
          // so clustering can count unique outlets correctly.
          sourceId: item.sourceDomain ? `gnews:${item.sourceDomain}` : `google-news:${q.topic}`,
          sourceName: item.sourceName || `Google News — ${q.topic}`,
          domain: item.sourceDomain || null,
          kind: 'google-news',
          topic: q.topic,
          googleNewsQuery: q.query,
          origin: 'google-news',
        });
        results.itemsIngested++;
      }
      results.succeeded++;
      results.byTopic[q.topic] = items.length;
    } catch (err) {
      console.warn(`[gnews] ${q.topic}: ${err.message}`);
      results.failed++;
    }
  }));
  return results;
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  const { db, Timestamp, FieldValue } = await loadFirestore();
  const { RSS_ENABLED_SOURCES, GOOGLE_NEWS_QUERIES, sourceStats } = await loadSources();

  console.log('[collect] stats:', sourceStats());

  // Inline upsert — duplicated from src/lib/media-signals-db.js so the script
  // doesn't need Next.js module resolution.
  const COL = 'mediaSignals';
  function idForUrl(url) { return url.replace(/[^\w-]/g, '_').slice(0, 500); }
  async function upsert(signal) {
    if (!signal.url) return;
    const id = idForUrl(signal.url);
    const ref = db.collection(COL).doc(id);
    const existing = await ref.get();
    await ref.set({
      ...signal,
      firstSeenAt: existing.exists ? existing.data().firstSeenAt : FieldValue.serverTimestamp(),
      lastSeenAt: FieldValue.serverTimestamp(),
      seenCount: (existing.exists ? existing.data().seenCount || 0 : 0) + 1,
      publishedAt: signal.publishedAt ? Timestamp.fromDate(new Date(signal.publishedAt)) : null,
    }, { merge: true });
  }

  console.log(`[rss]   polling ${RSS_ENABLED_SOURCES.length} RSS sources…`);
  const rssResults = await collectRssSources(RSS_ENABLED_SOURCES, upsert);
  console.log('[rss]  ', rssResults);

  console.log(`[gnews] polling ${GOOGLE_NEWS_QUERIES.length} Google News queries…`);
  const gnewsResults = await collectGoogleNews(GOOGLE_NEWS_QUERIES, upsert);
  console.log('[gnews]', gnewsResults);

  // Roll-up summary
  await db.collection('mediaDeskStats').doc('latest').set({
    runAt: FieldValue.serverTimestamp(),
    rss: rssResults,
    googleNews: gnewsResults,
    totalItems: rssResults.itemsIngested + gnewsResults.itemsIngested,
  }, { merge: true });

  console.log(`[done] ingested ${rssResults.itemsIngested + gnewsResults.itemsIngested} items total`);
}

main().catch(e => { console.error(e); process.exit(1); });
