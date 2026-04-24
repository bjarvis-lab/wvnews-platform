// Server-side Firebase Admin SDK client — shared across API routes and server
// components. Initializes once per process (Next.js can hot-reload this file,
// so we guard against duplicate app initialization).
//
// Credential source precedence:
//   1. FIREBASE_SERVICE_ACCOUNT_KEY — JSON string (used on Vercel)
//   2. GOOGLE_APPLICATION_CREDENTIALS — file path (used in local dev)
//
// Both point at the same wvnews-crm service account; only the delivery
// mechanism differs because Vercel's serverless FS doesn't persist files.

import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Normalize an env-supplied service-account JSON. The common Vercel pitfall is
// that the private_key field arrives with literal "\n" sequences (two chars)
// instead of actual newline characters — the Firebase cert parser rejects it
// with "Invalid PEM formatted message". This function repairs that case.
function parseServiceAccount(raw) {
  let s = raw.trim();
  // Some tools wrap the whole thing in outer single or double quotes.
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  let obj;
  try {
    obj = JSON.parse(s);
  } catch (e) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON: ${e.message}`);
  }
  if (obj.private_key && obj.private_key.includes('\\n') && !obj.private_key.includes('\n')) {
    obj.private_key = obj.private_key.replace(/\\n/g, '\n');
  }
  return obj;
}

function getCredential() {
  const inlineKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (inlineKey) {
    const parsed = typeof inlineKey === 'string' ? parseServiceAccount(inlineKey) : inlineKey;
    return cert(parsed);
  }
  return applicationDefault();
}

const app = getApps()[0] || initializeApp({
  credential: getCredential(),
  projectId: process.env.FIREBASE_PROJECT_ID || 'wvnews-crm',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'wvnews-crm.firebasestorage.app',
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
