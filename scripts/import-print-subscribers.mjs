// One-shot bulk import for print subscribers exported from PrintManager.
//
// Reads a CSV or JSON file and writes each row into the `subscribers`
// collection via the same upsertPrintSubscriber path the live app uses,
// so bundleType + auto-digital records get computed correctly.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=~/secrets/wvnews-crm-sa.json \
//     node scripts/import-print-subscribers.mjs <path-to-export.json>
//
// Expected JSON shape (array of):
//   {
//     printManagerId: 12345,
//     name: "Jane Doe",
//     email: "jane@example.com" | null,
//     phone?: "...",
//     address?: { street, city, state, zip },
//     plan: "daily-7day",
//     edition: "Exponent Telegram",
//     deliveryMethod: "carrier",
//     startDate: "2024-01-15",
//     endDate?: "2026-12-31",
//     carrierRoute?: "ET-014"
//   }
//
// Pass --dry-run to preview without writing.
// Pass --send-claims to fire claim emails as we go (rate-limited to 1/sec).

import { readFileSync } from 'node:fs';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sendClaims = args.includes('--send-claims');
const filePath = args.find(a => !a.startsWith('--'));
if (!filePath) {
  console.error('Usage: node scripts/import-print-subscribers.mjs <export.json> [--dry-run] [--send-claims]');
  process.exit(1);
}

if (!getApps().length) {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const credential = inline
    ? cert(typeof inline === 'string' ? JSON.parse(inline) : inline)
    : applicationDefault();
  initializeApp({ credential, projectId: process.env.FIREBASE_PROJECT_ID || 'wvnews-crm' });
}
const db = getFirestore();

function slugFromEmail(email) {
  if (!email) return null;
  return email.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

function resolveBundleType({ print, digital }) {
  if (digital?.source === 'comp' || print?.plan === 'comp') return 'comp';
  if (print?.active && !digital) return 'print-only-no-email';
  if (print?.active && digital?.hasClaimed) return 'print-bundle-active';
  if (print?.active && digital) return 'print-bundle-unclaimed';
  if (digital?.active) return 'digital-only';
  return 'print-only-no-email';
}

const raw = readFileSync(filePath, 'utf8');
const records = JSON.parse(raw);
if (!Array.isArray(records)) {
  console.error('Export file must be a JSON array of subscriber objects.');
  process.exit(1);
}
console.log(`Loaded ${records.length} records${dryRun ? ' (dry run)' : ''}.`);

const now = () => new Date().toISOString();

let written = 0;
let skipped = 0;
let withEmail = 0;
let withoutEmail = 0;

const claimQueue = [];

for (const r of records) {
  if (!r.printManagerId) {
    console.warn(`Skipping record without printManagerId: ${JSON.stringify(r).slice(0, 120)}`);
    skipped++;
    continue;
  }

  const email = r.email || null;
  const docId = slugFromEmail(email) || `pm-${r.printManagerId}`;
  const ref = db.collection('subscribers').doc(docId);
  const existingSnap = !dryRun ? await ref.get() : { exists: false };
  const existing = existingSnap.exists ? existingSnap.data() : null;

  const printBlock = {
    active: true,
    plan: r.plan || 'daily-7day',
    edition: r.edition || null,
    deliveryMethod: r.deliveryMethod || 'carrier',
    startDate: r.startDate || now(),
    endDate: r.endDate || null,
    printManagerId: Number(r.printManagerId),
    carrierRoute: r.carrierRoute || null,
  };

  let digitalBlock = existing?.digital || null;
  if (email && !digitalBlock) {
    digitalBlock = {
      active: true,
      source: 'print-bundle',
      plan: null,
      startDate: now(),
      hasClaimed: false,
    };
  }

  const merged = {
    email,
    emailLower: email ? email.toLowerCase() : null,
    firebaseUid: existing?.firebaseUid || null,
    name: r.name || existing?.name || '',
    phone: r.phone || existing?.phone || null,
    address: r.address || existing?.address || null,
    print: printBlock,
    digital: digitalBlock,
    tags: existing?.tags || [],
    source: existing?.source || 'import',
    createdAt: existing?.createdAt || now(),
    updatedAt: now(),
  };
  merged.bundleType = resolveBundleType({ print: merged.print, digital: merged.digital });

  if (dryRun) {
    console.log(`[dry] ${docId} → ${merged.bundleType}${email ? ` (${email})` : ''}`);
  } else {
    await ref.set(merged, { merge: false });
  }

  written++;
  if (email) {
    withEmail++;
    if (sendClaims && !merged.digital?.claimEmailSentAt) claimQueue.push(docId);
  } else {
    withoutEmail++;
  }

  if (written % 100 === 0) console.log(`  ... ${written}/${records.length}`);
}

console.log(`\nDone.`);
console.log(`  written:        ${written}`);
console.log(`  skipped:        ${skipped}`);
console.log(`  with email:     ${withEmail}`);
console.log(`  without email:  ${withoutEmail}`);

if (sendClaims && !dryRun && claimQueue.length) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const token = process.env.INTERNAL_API_TOKEN;
  if (!baseUrl || !token) {
    console.warn('\n--send-claims passed but NEXT_PUBLIC_SITE_URL or INTERNAL_API_TOKEN not set — skipping email send.');
    process.exit(0);
  }
  console.log(`\nSending ${claimQueue.length} claim emails (1/sec rate limit)…`);
  for (const id of claimQueue) {
    try {
      const res = await fetch(`${baseUrl}/api/subscribers/${id}/send-claim`, {
        method: 'POST',
        headers: { 'x-internal-token': token },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn(`  ✗ ${id}: ${data.error || res.status}`);
      } else {
        console.log(`  ✓ ${id}`);
      }
    } catch (err) {
      console.warn(`  ✗ ${id}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}
