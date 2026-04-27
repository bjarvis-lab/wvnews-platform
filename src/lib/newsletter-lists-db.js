// Firestore-backed mapping of publication id → Constant Contact list id.
// Stored as a single doc at settings/newsletterLists for simplicity:
//
//   {
//     mapping: { wvnews: 'list-id-1', exponent: 'list-id-2', ... },
//     updatedAt: ISO,
//     updatedBy: email
//   }
//
// Editors set this once via /admin/newsletters/lists. The push-to-cc
// route reads from here to route each newsletter to the right list.

import { db } from './firebase-admin';

const DOC = db.collection('settings').doc('newsletterLists');

export async function getNewsletterListMapping() {
  const snap = await DOC.get();
  if (!snap.exists) return { mapping: {}, updatedAt: null, updatedBy: null };
  const data = snap.data();
  return {
    mapping: data.mapping || {},
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null,
    updatedBy: data.updatedBy || null,
  };
}

// Look up the CC list id for a single publication. Returns null when no
// mapping exists — caller should fall back to CC_DEFAULT_LIST_ID.
export async function getListIdForPublication(publicationId) {
  const { mapping } = await getNewsletterListMapping();
  return mapping[publicationId] || null;
}

// Replace the entire mapping atomically. We accept the full mapping
// object rather than partial updates so the UI can save everything in
// one round-trip after the user reorders/edits.
export async function saveNewsletterListMapping(mapping, updatedBy) {
  const clean = {};
  for (const [k, v] of Object.entries(mapping || {})) {
    if (v && typeof v === 'string') clean[k] = v;
  }
  await DOC.set({
    mapping: clean,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || null,
  }, { merge: false });
  return { mapping: clean };
}
