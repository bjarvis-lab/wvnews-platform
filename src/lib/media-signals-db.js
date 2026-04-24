// Firestore data layer for the Media Desk mediaSignals collection.
// A "signal" is a single incoming item (RSS entry, Google News result,
// future FB post). Collectors upsert signals with a stable sourceUrl-based
// doc id so reruns are idempotent.

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase-admin';

const COL = 'mediaSignals';

function serialize(docSnap) {
  const data = docSnap.data();
  if (!data) return null;
  const out = { id: docSnap.id, ...data };
  for (const [k, v] of Object.entries(out)) {
    if (v && typeof v === 'object' && typeof v.toDate === 'function') {
      out[k] = v.toDate().toISOString();
    }
  }
  return out;
}

// URL-derived doc ids so reruns upsert instead of duplicating.
function idForUrl(url) {
  // Firestore doc IDs can't contain /, avoid newlines, limit to 1500 bytes.
  return url.replace(/[^\w-]/g, '_').slice(0, 500);
}

export async function upsertSignal(signal) {
  if (!signal.url) return null;
  const id = idForUrl(signal.url);
  const ref = db.collection(COL).doc(id);
  const existing = await ref.get();

  await ref.set({
    ...signal,
    firstSeenAt: existing.exists ? existing.data().firstSeenAt : FieldValue.serverTimestamp(),
    lastSeenAt: FieldValue.serverTimestamp(),
    seenCount: (existing.exists ? existing.data().seenCount || 0 : 0) + 1,
    publishedAt: signal.publishedAt ? Timestamp.fromDate(new Date(signal.publishedAt)) : null,
  }, { merge: true });

  return { id, created: !existing.exists };
}

export async function listRecentSignals({ limit = 100, source, kind, topic, since } = {}) {
  let q = db.collection(COL).orderBy('lastSeenAt', 'desc').limit(Math.max(limit * 2, 100));
  const snap = await q.get();
  let rows = snap.docs.map(serialize);
  if (source) rows = rows.filter(r => r.sourceId === source);
  if (kind)   rows = rows.filter(r => r.kind === kind);
  if (topic)  rows = rows.filter(r => r.topic === topic);
  if (since)  rows = rows.filter(r => new Date(r.lastSeenAt) >= new Date(since));
  return rows.slice(0, limit);
}

export async function getSignalCounts() {
  const snap = await db.collection(COL).count().get();
  return { total: snap.data().count };
}

// "Needs attention" sources = RSS feeds that returned nothing in the last
// two cron runs. Surfaced in the Media Desk admin so we can fix bad URLs
// or disable dead sources.
export async function listStaleSources({ hours = 24 } = {}) {
  // Placeholder — requires a sourceHealth doc populated by the collector.
  // For MVP, skip this and add later.
  return [];
}
