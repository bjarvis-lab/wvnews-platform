// Media Desk — server component. Lists recent signals from RSS + Google
// News collectors so editors can spot breaking stories, trending topics,
// and coverage gaps. Clicking a signal links out to the source; "Draft a
// story" pre-fills the brief in the story editor (TODO — next session).

import { listRecentSignals, listClusters, getSignalsByIds } from '@/lib/media-signals-db';
import { sourceStats } from '@/data/media-sources';
import MediaDeskClient from './MediaDeskClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Common JSON-round-trip helper to drop Firestore Timestamps before handing
// data to a client component.
const strip = (v) => JSON.parse(JSON.stringify(v, (_k, x) => (x?.toDate ? x.toDate().toISOString() : x)));

async function loadStats(doc) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const snap = await db.collection('mediaDeskStats').doc(doc).get();
    return snap.exists ? strip(snap.data()) : null;
  } catch { return null; }
}

export default async function MediaDeskPage() {
  let signals = [];
  let clusters = [];
  try { signals  = strip(await listRecentSignals({ limit: 200 })); } catch {}
  try { clusters = strip(await listClusters({ limit: 20 })); } catch {}

  // Pre-load every cluster's member signals so the UI expands instantly
  // without needing a per-cluster API fetch. One batch read covers them all.
  const memberIdUnion = Array.from(new Set(clusters.flatMap(c => c.memberSignalIds || [])));
  let memberSignals = {};
  if (memberIdUnion.length) {
    try {
      const rows = strip(await getSignalsByIds(memberIdUnion));
      memberSignals = Object.fromEntries(rows.map(r => [r.id, r]));
    } catch {}
  }

  const stats = sourceStats();
  const collectorStats = await loadStats('latest');
  const clusterStats  = await loadStats('latestCluster');

  return (
    <MediaDeskClient
      signals={signals}
      clusters={clusters}
      memberSignals={memberSignals}
      stats={stats}
      collectorStats={collectorStats}
      clusterStats={clusterStats}
    />
  );
}
