// Diagnostic — print every signal in every currently-isBreaking cluster
// with its firstSeenAt / publishedAt / lastSeenAt / URL so we can see
// whether the cluster is genuinely fresh or whether sources are
// re-listing old stories.
//
// Usage:
//   set -a && source .env.local && set +a && \
//     GOOGLE_APPLICATION_CREDENTIALS=~/secrets/wvnews-crm-sa.json \
//     node scripts/debug-breaking-clusters.mjs

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

const fmtTs = t => t?.toDate ? t.toDate().toISOString().replace('T', ' ').slice(0, 19) : '            (none)';
const ago = t => {
  if (!t?.toDate) return '   ?';
  const ms = Date.now() - t.toDate().getTime();
  const h = Math.round(ms / 3600000);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
};

const clustersSnap = await db.collection('mediaClusters')
  .orderBy('lastSeenAt', 'desc')
  .limit(20)
  .get();

let breakingFound = 0;
for (const doc of clustersSnap.docs) {
  const c = doc.data();
  if (!c.isBreaking) continue;
  breakingFound++;
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`BREAKING: ${c.primaryTitle}`);
  console.log(`  cluster id:           ${doc.id}`);
  console.log(`  firstSeenAt:          ${fmtTs(c.firstSeenAt)}  (${ago(c.firstSeenAt)} ago)`);
  console.log(`  newestPublishedAt:    ${fmtTs(c.newestPublishedAt)}  (${ago(c.newestPublishedAt)} ago)`);
  console.log(`  lastSeenAt:           ${fmtTs(c.lastSeenAt)}  (${ago(c.lastSeenAt)} ago)`);
  console.log(`  uniqueDomainCount:    ${c.uniqueDomainCount}`);
  console.log(`  members (${c.memberCount}):`);

  for (const memberId of (c.memberSignalIds || []).slice(0, 15)) {
    const sig = await db.collection('mediaSignals').doc(memberId).get();
    if (!sig.exists) {
      console.log(`    [missing]  ${memberId.slice(0, 60)}…`);
      continue;
    }
    const s = sig.data();
    console.log(`    ─ ${s.sourceName || s.domain || '?'}`);
    console.log(`        firstSeenAt:  ${fmtTs(s.firstSeenAt)}  (${ago(s.firstSeenAt)} ago)`);
    console.log(`        publishedAt:  ${fmtTs(s.publishedAt)}  (${ago(s.publishedAt)} ago)`);
    console.log(`        lastSeenAt:   ${fmtTs(s.lastSeenAt)}  (${ago(s.lastSeenAt)} ago)`);
    console.log(`        kind:         ${s.kind}`);
    console.log(`        title:        ${(s.title || '').slice(0, 90)}`);
    console.log(`        url:          ${s.url}`);
  }
}
if (breakingFound === 0) console.log('No isBreaking clusters found in the latest 20.');
