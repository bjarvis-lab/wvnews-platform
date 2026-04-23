// Probe the wvnews-crm Firestore: list top-level collections, sample a few
// docs from each, and print the inferred field shape. Read-only — touches
// nothing in the CRM data.
//
// Run: node scripts/test-crm-connection.mjs
// Requires GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY set.

import 'dotenv/config';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function credential() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (inline) return cert(typeof inline === 'string' ? JSON.parse(inline) : inline);
  return applicationDefault();
}

const app = initializeApp({
  credential: credential(),
  projectId: process.env.FIREBASE_PROJECT_ID || 'wvnews-crm',
});
const db = getFirestore(app);

const sampleFields = (doc) => {
  const data = doc.data();
  const shape = {};
  for (const [k, v] of Object.entries(data || {})) {
    shape[k] =
      v === null ? 'null' :
      Array.isArray(v) ? `array[${v.length}]` :
      v?.toDate ? 'Timestamp' :
      v?._path ? `DocumentReference(${v._path.segments.join('/')})` :
      typeof v === 'object' ? `{${Object.keys(v).slice(0, 3).join(',')}${Object.keys(v).length > 3 ? ',…' : ''}}` :
      typeof v;
  }
  return shape;
};

async function main() {
  console.log(`Connecting to ${process.env.FIREBASE_PROJECT_ID || 'wvnews-crm'}…`);
  const collections = await db.listCollections();
  if (collections.length === 0) {
    console.log('No top-level collections — the CRM is empty or rules block listing.');
    return;
  }

  console.log(`\nFound ${collections.length} collections:\n`);
  for (const col of collections) {
    const snap = await col.limit(3).get();
    const count = (await col.count().get()).data().count;
    console.log(`▸ ${col.id}  (${count} docs total)`);
    if (snap.empty) {
      console.log(`    (no docs)`);
      continue;
    }
    const fields = sampleFields(snap.docs[0]);
    for (const [k, t] of Object.entries(fields)) {
      console.log(`    ${k}: ${t}`);
    }
    if (snap.size > 0) {
      console.log(`    ─ sample ids: ${snap.docs.map(d => d.id).join(', ')}`);
    }
    console.log();
  }
}

main().catch(e => {
  console.error('\n❌ FAIL:', e.message);
  if (e.message.includes('PERMISSION_DENIED')) {
    console.error('\nThe service account can reach the project but Firestore rules or IAM');
    console.error('roles are blocking reads. In Firebase console → Firestore → Rules, the');
    console.error('default should allow admin SDK reads. Check IAM roles on the service account.');
  }
  process.exit(1);
});
