// Site-wide red ribbon that appears at the top of every public page whenever
// any native story has breaking=true && status='published'. Server component
// rendering so the ribbon hydrates with real data on first paint.
//
// Renders nothing when there's no active breaking news.

import Link from 'next/link';
import { headers } from 'next/headers';
import { getBreakingStories } from '@/lib/stories-db';

export default async function BreakingNewsRibbon() {
  // Only render on public routes. Admin + signin get their own chrome.
  const pathname = headers().get('x-pathname') || '';
  if (pathname.startsWith('/admin')) return null;

  let stories = [];
  try {
    stories = await getBreakingStories({ limit: 3 });
  } catch {
    return null; // Firestore may be misconfigured in a preview env — fail quiet
  }
  if (!stories.length) return null;

  // Multiple breaking stories: show the newest prominently + count the rest.
  const [lead, ...rest] = stories;

  return (
    <div className="bg-red-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
          ● Breaking
        </span>
        <Link
          href={`/article/${lead.slug}`}
          className="font-semibold hover:underline truncate flex-1"
        >
          {lead.headline}
        </Link>
        {rest.length > 0 && (
          <span className="hidden md:inline text-xs text-white/80 whitespace-nowrap">
            +{rest.length} more
          </span>
        )}
      </div>
    </div>
  );
}
