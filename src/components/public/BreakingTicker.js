'use client';
import Link from 'next/link';

export default function BreakingTicker({ story }) {
  if (!story) return null;
  return (
    <div className="bg-red-600 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-9">
        <span className="flex-shrink-0 px-3 py-0.5 bg-white text-red-600 text-[10px] font-bold uppercase tracking-widest rounded mr-4 animate-pulse">
          Breaking
        </span>
        <div className="overflow-hidden flex-1">
          <Link href={`/article/${story.slug}`} className="ticker-scroll inline-block whitespace-nowrap text-sm font-medium hover:underline">
            {story.headline} — {story.deck}
          </Link>
        </div>
      </div>
    </div>
  );
}
