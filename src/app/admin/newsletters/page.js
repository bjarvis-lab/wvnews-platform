// Newsletter composer + campaign performance dashboard. Pick a
// publication, generate a preview, send a test via Resend, and push to
// Constant Contact when ready. Recent CC campaigns + their stats render
// below the composer so editors can see what's landing.

import Link from 'next/link';
import NewsletterComposer from './NewsletterComposer';
import RecentCampaigns from './RecentCampaigns';
import { sites } from '@/data/mock';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function NewslettersPage() {
  const user = await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900">Newsletter Composer</h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Auto-build a daily newsletter from each publication&apos;s most important stories. Preview, send a test
            to yourself, then push to Constant Contact when ready.
          </p>
        </div>
        <Link href="/admin/newsletters/lists" className="text-xs text-brand-700 hover:text-brand-900 underline">
          Manage CC list mapping →
        </Link>
      </div>

      <NewsletterComposer sites={sites} userEmail={user.email || user.profile?.email || ''} />

      <RecentCampaigns />
    </div>
  );
}
