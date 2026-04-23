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

function getCredential() {
  const inlineKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (inlineKey) {
    const parsed = typeof inlineKey === 'string' ? JSON.parse(inlineKey) : inlineKey;
    return cert(parsed);
  }
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS file path.
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
