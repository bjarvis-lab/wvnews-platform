// Users & permissions admin. Lists every user in the shared wvnews-crm
// `users` collection, shows their role + effective permissions, and lets
// admins change the role, toggle individual module access, or deactivate.
//
// Non-admin users are redirected out by the layout's module gate — this
// page itself is keyed to the `users` module.

import { db } from '@/lib/firebase-admin';
import { MODULES, ROLE_DEFAULTS, effectivePermissions } from '@/lib/permissions';
import UsersAdminClient from './UsersAdminClient';

export const dynamic = 'force-dynamic';

async function loadUsers() {
  const snap = await db.collection('users').orderBy('email').limit(200).get();
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      uid: data.uid || d.id,
      email: data.email || '',
      name: data.name || '',
      photo: data.photo || '',
      role: data.role || 'reporter',
      permissions: Array.isArray(data.permissions) ? data.permissions : null,
      active: data.active !== false,
      lastLogin: data.lastLogin || null,
      createdAt: data.createdAt || null,
    };
  });
}

export default async function UsersPage() {
  const users = await loadUsers();
  return (
    <UsersAdminClient
      users={users}
      modules={MODULES}
      roleDefaults={ROLE_DEFAULTS}
    />
  );
}
