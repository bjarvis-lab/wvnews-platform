// Diagnose newsletter selection — duplicates the library logic (with
// the aggregator carve-out) so we can verify against production
// Firestore without going through Next.js module resolution.

import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const publication = process.argv[2] || 'wvnews';
const hoursBack = Number(process.argv[3] || 24);

if (!getApps().length) {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const credential = inline
    ? cert(typeof inline === 'string' ? JSON.parse(inline) : inline)
    : applicationDefault();
  initializeApp({ credential, projectId: process.env.FIREBASE_PROJECT_ID || 'wvnews-crm' });
}
const db = getFirestore();

const HOUR = 3600_000;
const AGGREGATOR_PUBLICATIONS = new Set(['wvnews', 'all']);
const isAggregator = AGGREGATOR_PUBLICATIONS.has(publication);
const cutoff = Date.now() - hoursBack * HOUR;
const count = 8;
const overfetch = Math.max(count * (isAggregator ? 25 : 5), 80);

const snap = await db.collection('stories').orderBy('publishedAt', 'desc').limit(overfetch).get();

const candidates = [];
for (const doc of snap.docs) {
  const d = { id: doc.id, ...doc.data() };
  const pubMs = d.publishedAt?.toDate?.()?.getTime?.() || 0;
  if (pubMs < cutoff) continue;
  if (d.status && d.status !== 'published') continue;
  if (!isAggregator && publication && Array.isArray(d.sites) && d.sites.length > 0 && !d.sites.includes(publication)) continue;
  candidates.push({
    id: d.id,
    headline: d.headline,
    sites: d.sites || [],
    image: d.image?.url || null,
    breaking: !!d.breaking,
    featured: !!d.featured,
    publishedAt: pubMs,
    views: d.stats?.views || 0,
  });
}

const scored = candidates.map(c => {
  let score = 0;
  if (c.breaking) score += 100;
  if (c.featured) score += 50;
  score += Math.min(c.views / 10, 80);
  if (Date.now() - c.publishedAt < 6 * HOUR) score += 10;
  if (c.image) score += 5;
  return { ...c, score };
}).sort((a, b) => b.score - a.score);

const PER_SITE_CAP = 2;
let picked;
if (isAggregator) {
  const seen = new Map();
  picked = [];
  for (const story of scored) {
    const site = (story.sites && story.sites[0]) || '_';
    if ((seen.get(site) || 0) >= PER_SITE_CAP) continue;
    picked.push(story);
    seen.set(site, (seen.get(site) || 0) + 1);
    if (picked.length >= count) break;
  }
  if (picked.length < count) {
    const have = new Set(picked.map(s => s.id));
    for (const story of scored) {
      if (have.has(story.id)) continue;
      picked.push(story);
      if (picked.length >= count) break;
    }
  }
} else {
  picked = scored.slice(0, count);
}

if (picked.length > 1 && !picked[0].image) {
  const idx = picked.findIndex(s => s.image);
  if (idx > 0) {
    const [withImage] = picked.splice(idx, 1);
    picked.unshift(withImage);
  }
}

console.log(`publication: ${publication} (${isAggregator ? 'aggregator' : 'per-publication'})`);
console.log(`candidates passed filters: ${candidates.length}`);
console.log(`final picks: ${picked.length}\n`);
picked.forEach((s, i) => {
  const pubTime = new Date(s.publishedAt).toISOString().slice(0, 16);
  const flags = [s.breaking && '🔴', s.featured && '⭐', s.image && '🖼'].filter(Boolean).join(' ');
  console.log(`  ${i + 1}. [${(s.sites?.[0] || '?').padEnd(12)}] ${pubTime} score=${String(Math.round(s.score)).padStart(3)} ${flags}`);
  console.log(`       ${(s.headline || '').slice(0, 100)}`);
});
