// Stories list — server component. Reads native stories from Firestore.
// Ingested stories intentionally not shown here (they live in /p/[slug]).

import Link from 'next/link';
import { listStories } from '@/lib/stories-db';
import { sections, sites } from '@/data/mock';
import StoriesListClient from './StoriesListClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StoriesPage() {
  const stories = await listStories({ source: 'native', limit: 200 });
  return <StoriesListClient stories={stories} sections={sections} sites={sites} />;
}
