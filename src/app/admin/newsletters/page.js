// Newsletter composer — live. Pick a publication, choose a content
// window, click Generate; we render the email HTML in an iframe preview
// pane on the right. Send-Test fires it via Resend to your inbox so you
// can check rendering in real clients (Outlook, Gmail, Apple Mail).
// Push-to-CC is wired but the API stub returns 501 until Constant
// Contact OAuth credentials are configured.

import NewsletterComposer from './NewsletterComposer';
import { sites } from '@/data/mock';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function NewslettersPage() {
  const user = await requireAdmin();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-ink-900">Newsletter Composer</h2>
        <p className="text-sm text-ink-500 mt-0.5">
          Auto-build a daily newsletter from each publication&apos;s most important stories. Preview, send a test
          to yourself, then push to Constant Contact when ready.
        </p>
      </div>
      <NewsletterComposer sites={sites} userEmail={user.email || user.profile?.email || ''} />
    </div>
  );
}
