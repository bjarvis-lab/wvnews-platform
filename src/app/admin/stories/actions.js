'use server';
// Server actions for story CRUD. Runs in the Next.js server runtime with
// firebase-admin access. Called from form submits in /admin/stories/new and
// /admin/stories/[id]/edit.

import { revalidatePath } from 'next/cache';
import {
  createNativeStory,
  updateStory,
  deleteStory,
} from '@/lib/stories-db';

// Converts the form payload into the story schema. Form fields come in as
// strings; array-ish fields (secondarySections, sites, tags) arrive as
// comma-separated strings from a simple text input.
function parseForm(data) {
  const list = (v) => (typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : []);
  return {
    headline: data.get('headline')?.toString() || '',
    seoHeadline: data.get('seoHeadline')?.toString() || '',
    deck: data.get('deck')?.toString() || '',
    body: data.get('body')?.toString() || '',
    section: data.get('section')?.toString() || 'news',
    secondarySections: list(data.get('secondarySections')?.toString()),
    sites: list(data.get('sites')?.toString()),
    accessLevel: data.get('accessLevel')?.toString() || 'free',
    tags: list(data.get('tags')?.toString()),
    featured: data.get('featured') === 'on',
    breaking: data.get('breaking') === 'on',
    image: data.get('imageUrl')
      ? { url: data.get('imageUrl').toString(), alt: data.get('imageAlt')?.toString() || '', credit: data.get('imageCredit')?.toString() || '' }
      : null,
    author: data.get('authorName')
      ? { name: data.get('authorName').toString(), role: data.get('authorRole')?.toString() || '', avatar: (data.get('authorName') || '').toString().split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() }
      : { name: 'WV News Staff', role: 'Staff', avatar: 'WV' },
  };
}

export async function createStoryAction(formData) {
  const publish = formData.get('_action') === 'publish';
  const input = parseForm(formData);
  const { id, slug } = await createNativeStory(input, { publish });
  revalidatePath('/admin/stories');
  revalidatePath(`/article/${slug}`);
  if (input.section) revalidatePath(`/section/${input.section}`);
  // Let the client close its modal + router.refresh(). No redirect — the list
  // page re-fetches and the new story appears.
  return { ok: true, id, slug };
}

export async function updateStoryAction(id, formData) {
  const action = formData.get('_action');
  const input = parseForm(formData);
  const publish = action === 'publish' ? true : action === 'unpublish' ? false : null;
  await updateStory(id, input, { publish });
  revalidatePath('/admin/stories');
  revalidatePath(`/admin/stories/${id}/edit`);
  if (input.section) revalidatePath(`/section/${input.section}`);
  return { ok: true };
}

export async function deleteStoryAction(id) {
  await deleteStory(id);
  revalidatePath('/admin/stories');
  return { ok: true };
}
