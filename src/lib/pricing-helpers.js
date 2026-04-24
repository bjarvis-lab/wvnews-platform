// Pure pricing helpers — no Node imports. Safe to use in client components
// and server components alike. Kept separate from pricing-db.js (which pulls
// in firebase-admin and can't cross the client boundary).

// Compute total for an obit/classified/etc. given a base type + selected
// add-ons. The server also calls this so what the user sees matches what
// they'll be charged.
export function calculateTotal(type, pricing, selections = {}) {
  const section = pricing?.[type];
  if (!section) return 0;

  if (type === 'legal') {
    const lines = Math.max(section.minimumLines || 0, selections.lines || 0);
    let total = lines * (section.perLinePrice || 0);
    for (const [k, qty] of Object.entries(selections.addOns || {})) {
      if (qty && section.addOns?.[k]) total += section.addOns[k].price * (qty === true ? 1 : Number(qty));
    }
    return Number(total.toFixed(2));
  }

  if (type === 'announcement') {
    const sub = selections.announcementType;
    const base = section.types?.[sub]?.price || 0;
    let total = base;
    for (const [k, qty] of Object.entries(selections.addOns || {})) {
      if (qty && section.addOns?.[k]) total += section.addOns[k].price * (qty === true ? 1 : Number(qty));
    }
    return Number(total.toFixed(2));
  }

  // obituary, classified
  let total = section.basePrice || 0;
  for (const [k, qty] of Object.entries(selections.addOns || {})) {
    if (qty && section.addOns?.[k]) total += section.addOns[k].price * (qty === true ? 1 : Number(qty));
  }
  return Number(total.toFixed(2));
}
