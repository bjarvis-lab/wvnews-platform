// Stories list — server component. Reads native stories from Firestore.
// Ingested stories intentionally not shown here (they live in /p/[slug]).
//
// When the URL has `?cluster=<id>`, we also pre-fetch that Media Desk cluster
// (and its member signals) so the client can auto-open the story editor with
// a brief pre-filled from the trending story's sources.

import { listStories } from '@/lib/stories-db';
import { getClusterWithMembers } from '@/lib/media-signals-db';
import { sections, sites } from '@/data/mock';
import StoriesListClient from './StoriesListClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const strip = (v) => (v == null ? v : JSON.parse(JSON.stringify(v, (_k, x) => (x?.toDate ? x.toDate().toISOString() : x))));

export default async function StoriesPage({ searchParams }) {
  const stories = await listStories({ source: 'native', limit: 200 });

  let initialCluster = null;
  if (searchParams?.cluster) {
    try { initialCluster = strip(await getClusterWithMembers(searchParams.cluster)); } catch {}
  }

  return (
    <StoriesListClient
      stories={stories}
      sections={sections}
      sites={sites}
      initialCluster={initialCluster}
    />
  );
}
