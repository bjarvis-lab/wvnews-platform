// /api/account/subscriptions
//
// GET — return the signed-in reader's per-publication newsletter
// memberships. Joins the publication ↔ CC list mapping with the
// reader's actual list memberships in CC.
//
// PUT — accept { subscribedPublications: [pubId, ...] } and replace
// the reader's CC list memberships accordingly. Adds them to the
// listed publications' CC lists; removes from the rest.
//
// Auth: requires a Firebase session (either reader or admin); we
// resolve the contact in CC by the session's email.

import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth-server.constants';
import { sites } from '@/data/mock';
import {
  refreshAccessToken,
  findContactByEmail,
  addContact,
  setContactLists,
} from '@/lib/cc-client';
import { getNewsletterListMapping } from '@/lib/newsletter-lists-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getReaderEmail() {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await getAuth(app).verifySessionCookie(cookie, true);
    return (decoded.email || '').toLowerCase() || null;
  } catch {
    return null;
  }
}

// Compute current state: { publications: [{ id, name, listId, subscribed }] }
async function readState() {
  const email = await getReaderEmail();
  if (!email) return { error: 'Not signed in.', status: 401 };

  if (!process.env.CC_REFRESH_TOKEN) {
    return { error: 'Constant Contact not authorized yet.', status: 501 };
  }

  const { mapping } = await getNewsletterListMapping();

  const tokens = await refreshAccessToken();
  const accessToken = tokens.access_token;
  const contact = await findContactByEmail({ accessToken, email });
  const memberships = new Set((contact?.list_memberships || []).map(String));

  const publications = sites.map(s => {
    const listId = mapping[s.id] || null;
    return {
      id: s.id,
      name: s.name,
      market: s.market || null,
      listId,
      subscribable: !!listId,
      subscribed: !!(listId && memberships.has(String(listId))),
    };
  });

  return {
    email,
    contactId: contact?.contact_id || null,
    publications,
  };
}

export async function GET() {
  const result = await readState();
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}

export async function PUT(request) {
  const email = await getReaderEmail();
  if (!email) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  if (!process.env.CC_REFRESH_TOKEN) {
    return NextResponse.json({ error: 'Constant Contact not authorized yet.' }, { status: 501 });
  }

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const { subscribedPublications = [] } = body;
  if (!Array.isArray(subscribedPublications)) {
    return NextResponse.json({ error: 'subscribedPublications must be an array of publication ids.' }, { status: 400 });
  }

  const { mapping } = await getNewsletterListMapping();
  const targetListIds = subscribedPublications
    .map(pubId => mapping[pubId])
    .filter(Boolean);

  const tokens = await refreshAccessToken();
  const accessToken = tokens.access_token;

  // If contact doesn't exist yet, create them with the chosen lists.
  let contact = await findContactByEmail({ accessToken, email });
  if (!contact) {
    const created = await addContact({
      accessToken,
      email,
      listMemberships: targetListIds,
      sourceDetails: 'wvnews-account-preferences',
    });
    return NextResponse.json({
      ok: true,
      contactId: created.contact_id,
      memberships: targetListIds,
      created: true,
    });
  }

  // Replace memberships on the existing contact.
  await setContactLists({ accessToken, contactId: contact.contact_id, listIds: targetListIds });
  return NextResponse.json({
    ok: true,
    contactId: contact.contact_id,
    memberships: targetListIds,
    created: false,
  });
}
