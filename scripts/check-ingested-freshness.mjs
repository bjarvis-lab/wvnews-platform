// Quick health probe — how fresh are our ingested stories?
// Counts by hour bucket so we can tell at a glance whether the cron
// is actually finding new articles.

import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const credential = inline
    ? cert(typeof inline === 'string' ? JSON.parse(inline) : inline)
    : applicationDefault();
  initializeApp({ credential, projectId: process.env.FIREBASE_PROJECT_ID || 'wvnews-crm' });
}
const db = getFirestore();

// Avoid composite-index requirement — pull recent + filter client-side
const snap0 = await db.collection('stories').orderBy('updatedAt', 'desc').limit(800).get();
const snap = { size: 0, docs: snap0.docs.filter(d => d.data().source === 'ingested') };
snap.size = snap.docs.length;
console.log(`Total ingested rows in latest 800: ${snap.size}\n`);

const buckets = { lastHour: 0, last4h: 0, last24h: 0, last7d: 0, older: 0 };
const sites = {};
const now = Date.now();

for (const doc of snap.docs) {
  const d = doc.data();
  const t = d.updatedAt?.toDate?.()?.getTime?.() || 0;
  const ageH = (now - t) / 3600000;
  if (ageH <= 1) buckets.lastHour++;
  else if (ageH <= 4) buckets.last4h++;
  else if (ageH <= 24) buckets.last24h++;
  else if (ageH <= 24 * 7) buckets.last7d++;
  else buckets.older++;
  const site = (d.sites?.[0]) || 'unknown';
  sites[site] = (sites[site] || 0) + 1;
}

console.log('age buckets:');
console.log(`  ≤ 1 hour:   ${buckets.lastHour}`);
console.log(`  ≤ 4 hours:  ${buckets.last4h}`);
console.log(`  ≤ 24 hours: ${buckets.last24h}`);
console.log(`  ≤ 7 days:   ${buckets.last7d}`);
console.log(`  > 7 days:   ${buckets.older}`);
console.log('\ntop sites by row count:');
const topSites = Object.entries(sites).sort((a, b) => b[1] - a[1]).slice(0, 10);
for (const [s, n] of topSites) console.log(`  ${s.padEnd(20)} ${n}`);

// Newest 5 by published time
console.log('\n5 newest by publishedAt:');
const byPub = snap.docs
  .map(d => ({ id: d.id, ...d.data() }))
  .filter(s => s.publishedAt)
  .sort((a, b) => (b.publishedAt?.toDate?.() || 0) - (a.publishedAt?.toDate?.() || 0))
  .slice(0, 5);
for (const s of byPub) {
  const ts = s.publishedAt?.toDate?.()?.toISOString().slice(0, 16) || '?';
  console.log(`  ${ts}  [${(s.sites?.[0] || '?').padEnd(12)}]  ${(s.headline || '').slice(0, 80)}`);
}
