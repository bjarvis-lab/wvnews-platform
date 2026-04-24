import Link from 'next/link';
import { notFound } from 'next/navigation';
import StoryForm from '@/components/admin/StoryForm';
import { updateStoryAction, deleteStoryAction } from '../../actions';
import { getStoryById } from '@/lib/stories-db';
import { sections, sites } from '@/data/mock';

export const dynamic = 'force-dynamic';

export default async function EditStoryPage({ params, searchParams }) {
  const { id } = params;
  const story = await getStoryById(id);
  if (!story) notFound();

  // Bind the id into the server action so the client only needs to supply formData
  const updateWithId = updateStoryAction.bind(null, id);
  const deleteWithId = deleteStoryAction.bind(null, id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/stories" className="text-xs text-ink-500 hover:text-ink-900">← All stories</Link>
          <h2 className="text-2xl font-display font-bold text-ink-900 mt-1">
            {story.status === 'published' ? 'Edit Published Story' : 'Edit Draft'}
          </h2>
        </div>
        {story.status === 'published' && story.slug && (
          <Link href={`/article/${story.slug}`} target="_blank" className="text-sm text-brand-700 hover:underline">
            View on site ↗
          </Link>
        )}
      </div>

      {searchParams?.saved && (
        <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg">
          ✓ Saved
        </div>
      )}

      <StoryForm
        action={updateWithId}
        initial={story}
        sections={sections}
        sites={sites}
        mode="edit"
        onDelete={deleteWithId}
      />
    </div>
  );
}
