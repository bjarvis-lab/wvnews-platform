'use client';
// Client-side Firebase init for admin sign-in. These values are PUBLIC by
// Firebase design — anyone can read them out of the JS bundle. Security lives
// in Firestore rules + server-side session verification, not in hiding these.
//
// We read from NEXT_PUBLIC_FIREBASE_* env vars, but fall back to the known
// wvnews-crm project config so dev/prod work without extra env setup.

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBwExHEC2ZDhrF75zPviIXf04FTZxeFWR8',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'wvnews-crm.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'wvnews-crm',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'wvnews-crm.firebasestorage.app',
};

const app = getApps().length ? getApp() : initializeApp(config);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
