// Self-serve pricing + rules, stored as a single Firestore doc at
// `pricing/config` so the whole rate card fetches in one read. Admins edit
// it via /admin/pricing; public forms read it to show current rates.
//
// Keeping all pricing in one doc (rather than a collection) because:
//   - small payload (<5KB), one Firestore read
//   - atomic updates (change a rate, everything sees it instantly)
//   - easy versioning / revert via Firestore history
//   - matches how small teams actually think about the rate card

import { db } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { calculateTotal } from './pricing-helpers';

export { calculateTotal };

const REF = db.collection('pricing').doc('config');

// Default rate card — seeded on first read if Firestore has nothing yet.
// Edit these to change the out-of-box defaults; once admin saves once, the
// Firestore copy wins.
export const DEFAULT_PRICING = {
  version: 1,

  obituary: {
    enabled: true,
    basePrice: 75,
    description: 'Standard obituary with one photo. Runs in one paper.',
    addOns: {
      extraPaper: { label: 'Run in an additional paper', price: 50 },
      featured: { label: 'Featured placement', price: 25 },
      extendedText: { label: 'Over 500 words (per 100 extra)', price: 15 },
      eversign: { label: 'Digital guestbook + memorial page', price: 40 },
    },
    notes: 'Photo included. Bold headline included. 500-word base; each additional 100 words billed separately.',
  },

  classified: {
    enabled: true,
    basePrice: 25,
    description: '4 lines, 1 week, online + one print run.',
    addOns: {
      extraWeek: { label: 'Each additional week', price: 15 },
      withPhoto: { label: 'Add a photo', price: 10 },
      bold: { label: 'Bold headline', price: 5 },
      featured: { label: 'Featured / top of category', price: 20 },
    },
    categories: ['For Sale', 'Help Wanted', 'Services', 'Real Estate', 'Vehicles', 'Pets', 'Yard Sale', 'Other'],
  },

  legal: {
    enabled: true,
    perLinePrice: 6.5,
    minimumLines: 8,
    description: 'Per-line rate for legal notices. Minimum charge applies.',
    addOns: {
      affidavitCopy: { label: 'Notarized affidavit of publication (PDF)', price: 15 },
      rushProcessing: { label: 'Next-day processing', price: 25 },
    },
    notes: 'Published in legal section. Affidavit mailed within 48 hours of last run.',
  },

  announcement: {
    enabled: true,
    types: {
      wedding: { label: 'Wedding', price: 100, description: '1 photo, up to 400 words, runs on Sunday social page.' },
      engagement: { label: 'Engagement', price: 75, description: '1 photo, up to 300 words.' },
      anniversary: { label: 'Anniversary', price: 75, description: '1 photo (then + now optional), up to 400 words.' },
      birth: { label: 'Birth announcement', price: 35, description: 'Name, DOB, parents, 1 photo optional.' },
      milestone: { label: 'Milestone / retirement', price: 50, description: 'Birthday, retirement, honor.' },
    },
    addOns: {
      extraPhoto: { label: 'Additional photo', price: 15 },
      color: { label: 'Full color in print', price: 20 },
      featured: { label: 'Featured placement', price: 25 },
    },
  },

  // Free form types — not priced but exposed here so the admin can toggle
  // visibility and set per-submission length limits.
  newsTip:       { enabled: true, description: 'Tip the newsroom — anonymous if you want.' },
  letter:        { enabled: true, description: 'Letter to the editor (500 words max).', wordLimit: 500 },
  event:         { enabled: true, description: 'Submit an event to the community calendar.' },
  advertise:     { enabled: true, description: 'Tell us about your business; a rep will contact you.' },
  sportsScore:   { enabled: true, description: 'Coaches and volunteers: submit a score.' },
  photo:         { enabled: true, description: 'Reader-submitted photo (weather, community, sports).', maxMB: 20 },
};

// Fetch the current rate card. Seeds defaults on first call.
export async function getPricing() {
  const snap = await REF.get();
  if (!snap.exists) {
    await REF.set({ ...DEFAULT_PRICING, updatedAt: FieldValue.serverTimestamp() });
    return { ...DEFAULT_PRICING, _seeded: true };
  }
  return snap.data();
}

export async function updatePricing(patch, actor) {
  await REF.set(
    { ...patch, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor || 'system' },
    { merge: true }
  );
  return { ok: true };
}

// calculateTotal moved to pricing-helpers.js (pure, client-safe) and
// re-exported above so existing server-side imports keep working.
