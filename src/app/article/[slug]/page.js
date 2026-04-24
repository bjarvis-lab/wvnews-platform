// Server component — tries Firestore first (native stories), falls back to
// src/data/mock.js so existing seeded slugs (e.g. the sample WVU / Capitol
// stories) keep resolving during the cutover period.

import { notFound } from 'next/navigation';
import { getStoryBySlug } from '@/lib/stories-db';
import { stories as mockStories, sections } from '@/data/mock';
import ArticleBody from './ArticleBody';

export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params }) {
  const { slug } = params;

  // Try Firestore first (native stories authored in /admin/stories)
  let story = await getStoryBySlug(slug, { source: 'native' });

  // Fall back to mock.js seeds so the demo articles still work
  if (!story) {
    const mock = mockStories.find(s => s.slug === slug);
    if (mock) story = { ...mock, source: 'mock' };
  }

  if (!story) notFound();

  // Sibling stories from the same section — Firestore-first would be better
  // but there's not enough native content yet; mock is fine.
  const related = mockStories.filter(s => s.slug !== slug).slice(0, 3);
  const sectionMore = mockStories
    .filter(s => s.section === story.section && s.slug !== slug)
    .slice(0, 3);

  const section = sections.find(s => s.id === story.section);

  return <ArticleBody story={story} section={section} sections={sections} related={related} sectionMore={sectionMore} />;
}
