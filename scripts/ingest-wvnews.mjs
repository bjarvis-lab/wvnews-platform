// Ingest recent stories from wvnews.com into src/data/ingested-stories.json.
//
// Two passes:
//   1) RSS — /search/?f=rss returns ~100 latest cross-publication items.
//      Articles are bucketed by URL-prefix (e.g. /theet/, /rivercities/).
//   2) Section backfill — any publication with fewer than TARGET_PER_SITE
//      items after pass 1 gets its section page scraped for additional cards.
//
// Keeps stories deduped by article ID and sorted newest-first.
// Run: node scripts/ingest-wvnews.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'data', 'ingested-stories.json');
const TARGET_PER_SITE = 10;

// URL prefix on wvnews.com → publication id in src/data/mock.js sites table.
const PREFIX_TO_SITE = {
  theet: 'exponent',
  bridgeportnews: 'bridgeport',
  morgantownnews: 'dominion',
  bluegoldnews: 'bluegold',
  recorddelta: 'recorddelta',
  jacksonnews: 'jackson',
  prestonnews: 'preston',
  garrettrepublican: 'garrett',
  braxtonnews: 'braxtondem',
  mountainstatesman: 'mtnstates',
  fairmontnews: 'fmn',
  rivercities: 'rivercities',
  spencernews: 'spencer',
  mineralnews: 'mineral',
  westondemocrat: 'weston',
  roanereporter: 'roane',
  bulletinboard: 'bulletin',
  // Cross-cutting sections — bucket to flagship
  sports: 'wvnews', newsfeed: 'wvnews', news: 'wvnews', business: 'wvnews',
  opinion: 'wvnews', obituaries: 'wvnews', entertainment: 'wvnews', lifestyles: 'wvnews',
};

const SITE_TO_PREFIX = Object.fromEntries(
  Object.entries(PREFIX_TO_SITE).filter(([, id]) => id !== 'wvnews').map(([p, id]) => [id, p])
);

const UA = 'Mozilla/5.0 (ingest; wvnews-platform)';
const fetchHTML = (url) => fetch(url, { headers: { 'User-Agent': UA } }).then(r => r.text());

// ---- Small helpers ----
function extract(item, tag) {
  const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : '';
}
function extractAttr(item, tag, attr) {
  const m = item.match(new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`));
  return m ? m[1] : '';
}
function decode(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#8230;/g, '…').replace(/&#39;/g, "'")
    .replace(/&#8217;/g, '’').replace(/&nbsp;/g, ' ');
}
function articleIdFromUrl(link) {
  const m = link.match(/article_([a-f0-9-]+)\.html/);
  return m ? m[1] : null;
}
function slugFromUrl(link) {
  const parts = link.replace(/^https?:\/\/www\.wvnews\.com\//, '').replace(/\/article_[a-f0-9-]+\.html$/, '').split('/');
  return parts[parts.length - 1] || '';
}

// ---- Pass 1: RSS ingest ----
async function ingestRSS() {
  const url = 'https://www.wvnews.com/search/?f=rss&t=article&l=500&s=start_time&sd=desc';
  console.log(`[RSS] ${url}`);
  const xml = await fetchHTML(url);
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  const bySite = {};

  for (const raw of items) {
    const link = decode(extract(raw, 'link'));
    const title = decode(extract(raw, 'title'));
    if (!link || !title) continue;

    const prefix = (link.match(/^https?:\/\/www\.wvnews\.com\/([^/]+)\//) || [])[1] || '';
    const siteId = PREFIX_TO_SITE[prefix] || 'wvnews';

    const story = {
      id: articleIdFromUrl(link) || link,
      slug: slugFromUrl(link),
      title,
      description: decode(extract(raw, 'description')).replace(/<[^>]*>/g, '').trim(),
      pubDate: new Date(extract(raw, 'pubDate')).toISOString(),
      author: decode(extract(raw, 'dc:creator')),
      image: extractAttr(raw, 'enclosure', 'url') || null,
      sourceUrl: link,
      prefix,
      source: 'rss',
    };
    (bySite[siteId] ||= []).push(story);
  }
  console.log(`[RSS] ${items.length} items → ${Object.keys(bySite).length} sites`);
  return bySite;
}

// ---- Pass 2: Section HTML backfill for thin publications ----
async function backfillSection(siteId, prefix) {
  const url = `https://www.wvnews.com/${prefix}/`;
  const html = await fetchHTML(url);

  // Capture every anchor that links into this publication's article pages and
  // pull a plain-text title from its innerHTML.
  const re = new RegExp(`<a[^>]*href="(/${prefix}/[^"]+/article_[a-f0-9-]+\\.html)"[^>]*>([\\s\\S]{0,800}?)</a>`, 'gi');
  const seen = new Set();
  const stories = [];

  for (const m of html.matchAll(re)) {
    const fullLink = `https://www.wvnews.com${m[1]}`;
    const id = articleIdFromUrl(fullLink);
    if (!id || seen.has(id)) continue;
    const inner = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (inner.length < 15) continue; // likely an image-only anchor
    seen.add(id);
    stories.push({
      id,
      slug: slugFromUrl(fullLink),
      title: decode(inner),
      description: '',
      pubDate: null, // section HTML doesn't carry reliable timestamps
      author: '',
      image: null,
      sourceUrl: fullLink,
      prefix,
      source: 'section',
    });
    if (stories.length >= 30) break;
  }
  console.log(`[section] ${siteId} (${prefix}) → ${stories.length} candidates`);
  return stories;
}

async function main() {
  const rssBySite = await ingestRSS();

  // Backfill any publication below target. Run requests in parallel (polite-ish).
  const thinSites = Object.entries(SITE_TO_PREFIX).filter(
    ([siteId]) => (rssBySite[siteId]?.length || 0) < TARGET_PER_SITE
  );
  console.log(`[backfill] ${thinSites.length} publications below target of ${TARGET_PER_SITE}`);

  const backfillResults = await Promise.all(
    thinSites.map(async ([siteId, prefix]) => {
      try { return [siteId, await backfillSection(siteId, prefix)]; }
      catch (e) { console.warn(`[backfill] ${siteId} failed:`, e.message); return [siteId, []]; }
    })
  );

  // Merge: RSS stories first (they have full metadata), then backfill fills the gap.
  const merged = { ...rssBySite };
  for (const [siteId, extras] of backfillResults) {
    const existing = merged[siteId] || [];
    const existingIds = new Set(existing.map(s => s.id));
    for (const s of extras) {
      if (existingIds.has(s.id)) continue;
      existing.push(s);
      if (existing.length >= TARGET_PER_SITE) break;
    }
    merged[siteId] = existing.slice(0, TARGET_PER_SITE);
  }

  // Also trim wvnews itself to the top N
  if (merged.wvnews) merged.wvnews = merged.wvnews.slice(0, TARGET_PER_SITE);

  const out = {
    fetchedAt: new Date().toISOString(),
    source: 'wvnews.com RSS + section HTML backfill',
    target: TARGET_PER_SITE,
    siteCounts: Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, v.length])),
    stories: merged,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`[done] wrote ${OUT}`);
  console.log('[done] counts:', out.siteCounts);
}

main().catch(e => { console.error(e); process.exit(1); });
