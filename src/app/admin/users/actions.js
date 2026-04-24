'use server';
// Server actions for updating user roles / permissions / active flag.
// Only admins can call these — enforced by checking the caller's role before
// writing.

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/auth-server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ROLE_DEFAULTS } from '@/lib/permissions';

async function assertAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error('Not authenticated');
  if (user.profile?.role !== 'admin') throw new Error('Only admins can manage users');
  return user;
}

export async function updateUserRoleAction(uid, formData) {
  await assertAdmin();
  const role = formData.get('role')?.toString() || 'reporter';
  if (!Object.keys(ROLE_DEFAULTS).includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  // Reset permissions when switching roles so the new defaults apply.
  // Admins can override afterward with the per-module toggles.
  await db.collection('users').doc(uid).update({
    role,
    permissions: FieldValue.delete(),
    updatedAt: new Date().toISOString(),
  });

  revalidatePath('/admin/users');
  return { ok: true };
}

export async function updateUserPermissionsAction(uid, formData) {
  await assertAdmin();
  const perms = formData.getAll('permissions').map(p => p.toString());
  await db.collection('users').doc(uid).update({
    permissions: perms,
    updatedAt: new Date().toISOString(),
  });
  revalidatePath('/admin/users');
  return { ok: true };
}

export async function toggleUserActiveAction(uid, active) {
  await assertAdmin();
  await db.collection('users').doc(uid).update({
    active: !!active,
    updatedAt: new Date().toISOString(),
  });
  revalidatePath('/admin/users');
  return { ok: true };
}
