// One-shot: promote a user to 'admin' role in the wvnews-crm users collection.
// Needed once per platform because auto-provisioned users default to 'editor'
// and don't have access to the /admin/users module that grants promotion.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=~/secrets/wvnews-crm-sa.json \
//     node scripts/promote-user.mjs bjarvis@wvnews.com admin

import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2];
const role = process.argv[3] || 'admin';
if (!email) {
  console.error('Usage: node scripts/promote-user.mjs <email> [role]');
  process.exit(1);
}

if (!getApps().length) {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const credential = inline
    ? cert(typeof inline === 'string' ? JSON.parse(inline) : inline)
    : applicationDefault();
  initializeApp({ credential, projectId: process.env.FIREBASE_PROJECT_ID || 'wvnews-crm' });
}
const db = getFirestore();

const snap = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
if (snap.empty) {
  console.error(`No user with email ${email}. They need to sign in once so the doc is auto-provisioned, then rerun this script.`);
  process.exit(1);
}
const doc = snap.docs[0];
await doc.ref.update({ role, updatedAt: new Date().toISOString() });
console.log(`✓ Promoted ${email} → role=${role} (uid ${doc.id})`);
