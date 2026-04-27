// One-shot cleanup: delete all `mediaClusters` docs that lack the
// `newestPublishedAt` field. These were written by the previous
// clusterer (before the publishedAt-fix) and have unreliable date
// fields, so the read path skips them anyway.
//
// Usage:
//   set -a && source .env.local && set +a && \
//     GOOGLE_APPLICATION_CREDENTIALS=~/secrets/wvnews-crm-sa.json \
//     node scripts/cleanup-stale-clusters.mjs [--dry-run]

import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const dryRun = process.argv.includes('--dry-run');

if (!getApps().length) {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const credential = inline
    ? cert(typeof inline === 'string' ? JSON.parse(inline) : inline)
    : applicationDefault();
  initializeApp({ credential, projectId: process.env.FIREBASE_PROJECT_ID || 'wvnews-crm' });
}
const db = getFirestore();

const snap = await db.collection('mediaClusters').get();
console.log(`scanning ${snap.size} cluster docs…`);

let kept = 0;
let toDelete = [];
for (const doc of snap.docs) {
  const d = doc.data();
  if (d.newestPublishedAt) {
    kept++;
  } else {
    toDelete.push(doc.ref);
  }
}

console.log(`  ${kept} have newestPublishedAt and will be kept`);
console.log(`  ${toDelete.length} are missing newestPublishedAt and will be ${dryRun ? 'logged (dry-run)' : 'deleted'}`);

if (!dryRun && toDelete.length) {
  // Firestore batch limit is 500 ops.
  for (let i = 0; i < toDelete.length; i += 400) {
    const batch = db.batch();
    toDelete.slice(i, i + 400).forEach(ref => batch.delete(ref));
    await batch.commit();
    console.log(`  deleted ${Math.min(i + 400, toDelete.length)}/${toDelete.length}`);
  }
}
console.log('done.');
