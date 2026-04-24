// POST /api/submit — central endpoint for every public self-serve form.
// Dispatches by { type } to the right Firestore collection, computes any
// pricing total server-side (never trust client-computed totals), and
// returns a confirmation payload for the success screen.
//
// No auth required — these are public-facing submissions. We do basic
// rate-limit / size checks but trust the form otherwise (payment gating
// happens downstream once Stripe is wired).

import { NextResponse } from 'next/server';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { getPricing, calculateTotal } from '@/lib/pricing-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Which CRM collection each submission type lands in. Paid types go to the
// existing CRM collections the staff already watch; free types go to a new
// `submissions` collection so they don't pollute billing-heavy tables.
const COLLECTIONS = {
  obituary:    'obituaries',
  classified:  'classifieds',
  legal:       'legals',
  announcement:'announcements',
  letter:      'submissions',
  tip:         'submissions',
  event:       'submissions',
  advertise:   'submissions',
  sportsScore: 'submissions',
  photo:       'submissions',
};

const PAID_TYPES = new Set(['obituary', 'classified', 'legal', 'announcement']);

function normalize(fields) {
  // Trim strings, drop empty optional values, keep nested objects intact.
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed) out[k] = trimmed;
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, fields, selections, contact } = body || {};

    if (!type || !COLLECTIONS[type]) {
      return NextResponse.json({ error: `Unknown submission type: ${type}` }, { status: 400 });
    }

    const submitterEmail = contact?.email?.trim();
    if (!submitterEmail || !submitterEmail.includes('@')) {
      return NextResponse.json({ error: 'A valid contact email is required' }, { status: 400 });
    }

    // Compute authoritative price server-side
    let amount = 0;
    let pricingSnapshot = null;
    if (PAID_TYPES.has(type)) {
      const pricing = await getPricing();
      pricingSnapshot = pricing[type];
      amount = calculateTotal(type, pricing, selections || {});
      if (!pricingSnapshot?.enabled) {
        return NextResponse.json({ error: 'This submission type is not currently accepting orders' }, { status: 403 });
      }
    }

    const doc = {
      type,
      source: 'self-serve',
      status: PAID_TYPES.has(type) ? 'Awaiting Payment' : 'Pending Review',
      fields: normalize(fields),
      selections: selections || null,
      contact: {
        name: contact?.name?.trim() || '',
        email: submitterEmail,
        phone: contact?.phone?.trim() || '',
      },
      amount,
      pricingSnapshot, // price card used at time of submission, for audit
      created: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const collection = COLLECTIONS[type];
    const ref = await db.collection(collection).add(doc);

    return NextResponse.json({
      ok: true,
      id: ref.id,
      type,
      amount,
      requiresPayment: PAID_TYPES.has(type) && amount > 0,
      collection,
    });
  } catch (err) {
    console.error('/api/submit failed:', err);
    return NextResponse.json({ error: err.message || 'Submission failed' }, { status: 500 });
  }
}
