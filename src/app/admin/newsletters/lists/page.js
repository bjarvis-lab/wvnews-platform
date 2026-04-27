// /admin/newsletters/lists — assign one Constant Contact list to each
// publication. Pulls the live list inventory from CC so editors don't
// have to hand-copy IDs.

import ListMappingClient from './ListMappingClient';
import { sites } from '@/data/mock';
import { requireAdmin } from '@/lib/auth-server';
import { getNewsletterListMapping } from '@/lib/newsletter-lists-db';

export const dynamic = 'force-dynamic';

export default async function NewsletterListsPage() {
  await requireAdmin();
  const initial = await getNewsletterListMapping().catch(() => ({ mapping: {}, updatedAt: null, updatedBy: null }));
  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900">Newsletter — Constant Contact lists</h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Assign each publication a Constant Contact contact list. The composer reads this mapping
            when pushing a draft so each newsletter targets the right audience.
          </p>
        </div>
        <a href="/admin/newsletters" className="text-xs text-brand-700 hover:text-brand-900">← Back to composer</a>
      </div>
      <ListMappingClient sites={sites} initialMapping={initial.mapping} updatedAt={initial.updatedAt} updatedBy={initial.updatedBy} />
    </div>
  );
}
