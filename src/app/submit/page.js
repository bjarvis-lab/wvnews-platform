// Public self-serve hub — server component. Reads the live rate card from
// Firestore and hands it to the client-side form picker. Admins edit rates
// via /admin/pricing and this page reflects them immediately.

import { Suspense } from 'react';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import { getPricing } from '@/lib/pricing-db';
import SubmitClient from './SubmitClient';

export const dynamic = 'force-dynamic';

export default async function SubmitPage({ searchParams }) {
  let pricing = null;
  try {
    const raw = await getPricing();
    // JSON round-trip strips Firestore Timestamp instances that can't cross
    // the RSC → client-component boundary.
    pricing = JSON.parse(JSON.stringify(raw, (_k, v) => (v?.toDate ? v.toDate().toISOString() : v)));
  } catch {
    pricing = null;
  }

  const selected = searchParams?.form || null;

  return (
    <div className="min-h-screen bg-ink-50">
      <PublicHeader />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <Suspense>
          <SubmitClient pricing={pricing} initialType={selected} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
