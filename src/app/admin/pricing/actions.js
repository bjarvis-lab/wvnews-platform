'use server';
// Server action — takes the full pricing object as JSON-stringified FormData
// and writes it to pricing/config. Stringifying keeps the form simple since
// the shape has deeply nested add-ons; the editor sends the whole payload.

import { revalidatePath } from 'next/cache';
import { updatePricing } from '@/lib/pricing-db';
import { getSessionUser } from '@/lib/auth-server';

export async function savePricingAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Not authenticated');
  const raw = formData.get('pricing');
  if (!raw) throw new Error('No pricing payload');
  const parsed = JSON.parse(raw);
  await updatePricing(parsed, user.email);
  revalidatePath('/admin/pricing');
  revalidatePath('/submit');
  return { ok: true };
}
