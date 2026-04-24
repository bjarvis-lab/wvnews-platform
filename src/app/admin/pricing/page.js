// Server component — reads current rate card, hands it to a client editor.
import { getPricing } from '@/lib/pricing-db';
import PricingEditor from './PricingEditor';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const raw = await getPricing();
  // Strip Firestore Timestamps so the object can cross the RSC boundary.
  const pricing = JSON.parse(JSON.stringify(raw, (_k, v) => (v?.toDate ? v.toDate().toISOString() : v)));
  return <PricingEditor initial={pricing} />;
}
