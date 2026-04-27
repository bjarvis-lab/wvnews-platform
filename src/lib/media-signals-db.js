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
  let q = db.collection(COL).orderBy('lastSeenAt', 'desc').limit(Math.max(limit * 4, 200));
  const snap = await q.get();
  let rows = snap.docs.map(serialize);
  if (source) rows = rows.filter(r => r.sourceId === source);
  if (kind)   rows = rows.filter(r => r.kind === kind);
  if (topic)  rows = rows.filter(r => r.topic === topic);
  if (since) {
    const sinceMs = new Date(since).getTime();
    // Gate on max(firstSeenAt, publishedAt) so re-syndicated old items
    // don't look new just because lastSeenAt was bumped this morning.
    rows = rows.filter(r => {
      const candidates = [r.firstSeenAt, r.publishedAt].filter(Boolean).map(t => new Date(t).getTime());
      const newest = candidates.length ? Math.max(...candidates) : 0;
      return newest >= sinceMs;
    });
  }
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

// Clusters — detected stories that ≥2 signals cover. Surfaced in the
// Media Desk as "Trending" / "Breaking" sections at the top.
//
// `since` is an ISO string: clusters whose lastSeenAt is older than that
// are dropped. The Media Desk uses this so we don't surface yesterday's
// breaking news as if it were still breaking.
export async function listClusters({ limit = 30, breakingOnly = false, trendingOnly = false, since } = {}) {
  let q = db.collection('mediaClusters').orderBy('lastSeenAt', 'desc').limit(limit * 2);
  const snap = await q.get();
  let rows = snap.docs.map(serialize);
  if (since) {
    const sinceMs = new Date(since).getTime();
    rows = rows.filter(r => r.lastSeenAt && new Date(r.lastSeenAt).getTime() >= sinceMs);
  }
  if (breakingOnly) rows = rows.filter(r => r.isBreaking);
  if (trendingOnly) rows = rows.filter(r => r.isTrending || r.isBreaking);
  return rows.slice(0, limit);
}

// Pull the full signal docs for a cluster (for expansion UI).
export async function getClusterMembers(clusterId) {
  const cluster = (await db.collection('mediaClusters').doc(clusterId).get()).data();
  if (!cluster?.memberSignalIds?.length) return [];
  return getSignalsByIds(cluster.memberSignalIds);
}

// Batch-fetch signals for multiple IDs. Used when the Media Desk page wants
// to render all cluster members at once without N round-trips.
export async function getSignalsByIds(ids) {
  if (!ids || ids.length === 0) return [];
  // Firestore getAll handles up to ~500 refs per call; our member counts are
  // always well under that.
  const refs = ids.map(id => db.collection('mediaSignals').doc(id));
  const docs = await db.getAll(...refs);
  return docs.filter(d => d.exists).map(serialize);
}

// Convenience: one cluster + its members in one round-trip. Used by the
// /admin/stories?cluster=... entry point for "Draft from this".
export async function getClusterWithMembers(clusterId) {
  const snap = await db.collection('mediaClusters').doc(clusterId).get();
  if (!snap.exists) return null;
  const cluster = serialize(snap);
  cluster.members = await getSignalsByIds(cluster.memberSignalIds || []);
  return cluster;
}
