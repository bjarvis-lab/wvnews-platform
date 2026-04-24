// Media Desk — server component. Lists recent signals from RSS + Google
// News collectors so editors can spot breaking stories, trending topics,
// and coverage gaps. Clicking a signal links out to the source; "Draft a
// story" pre-fills the brief in the story editor (TODO — next session).

import Link from 'next/link';
import { listRecentSignals } from '@/lib/media-signals-db';
import { sourceStats } from '@/data/media-sources';
import MediaDeskClient from './MediaDeskClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadCollectorStats() {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const snap = await db.collection('mediaDeskStats').doc('latest').get();
    if (!snap.exists) return null;
    const data = snap.data();
    // Strip Firestore Timestamps for RSC serialization
    return JSON.parse(JSON.stringify(data, (_k, v) => (v?.toDate ? v.toDate().toISOString() : v)));
  } catch {
    return null;
  }
}

export default async function MediaDeskPage() {
  let signals = [];
  try {
    signals = await listRecentSignals({ limit: 200 });
    signals = JSON.parse(JSON.stringify(signals, (_k, v) => (v?.toDate ? v.toDate().toISOString() : v)));
  } catch {
    signals = [];
  }
  const stats = sourceStats();
  const collectorStats = await loadCollectorStats();

  return <MediaDeskClient signals={signals} stats={stats} collectorStats={collectorStats} />;
}
