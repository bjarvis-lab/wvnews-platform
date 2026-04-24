// Server component — picks up section/site lists from mock.js for now.
// Renders a client StoryForm; the server action writes to Firestore.

import Link from 'next/link';
import StoryForm from '@/components/admin/StoryForm';
import { createStoryAction } from '../actions';
import { sections, sites } from '@/data/mock';

export const dynamic = 'force-dynamic';

export default function NewStoryPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/stories" className="text-xs text-ink-500 hover:text-ink-900">← All stories</Link>
          <h2 className="text-2xl font-display font-bold text-ink-900 mt-1">New Story</h2>
        </div>
      </div>

      <StoryForm action={createStoryAction} sections={sections} sites={sites} mode="new" />
    </div>
  );
}
