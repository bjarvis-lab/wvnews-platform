'use client';
// Users admin UI — role selector per user + expandable module-checkbox list
// for fine-grained overrides. Changes post via the server actions.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserRoleAction, updateUserPermissionsAction, toggleUserActiveAction } from './actions';

export default function UsersAdminClient({ users, modules, roleDefaults }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState(null);
  const [pending, startTransition] = useTransition();
  const [flashId, setFlashId] = useState(null);
  const [error, setError] = useState(null);

  function run(fn) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e.message || 'Update failed');
      }
    });
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h2 className="text-2xl font-display font-bold text-ink-900">Users & Permissions</h2>
        <p className="text-sm text-ink-500 mt-0.5">
          {users.length} {users.length === 1 ? 'user' : 'users'} · role changes reset permission overrides to that role&apos;s defaults.
        </p>
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg">{error}</div>
      )}

      {/* Role legend */}
      <div className="bg-white rounded-xl border border-ink-200 p-4">
        <div className="text-xs font-semibold text-ink-600 uppercase tracking-wider mb-2">Role defaults</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(roleDefaults).map(([role, perms]) => (
            <div key={role} className="text-xs">
              <div className="font-bold text-ink-900 capitalize">{role}</div>
              <div className="text-ink-500 mt-0.5">
                {perms.length === 0
                  ? 'no defaults — set explicit permissions'
                  : perms.length >= modules.length
                  ? 'all modules'
                  : `${perms.length} modules`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User list */}
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-10 text-center text-ink-500">
            No users yet. Users are auto-provisioned the first time they sign in with a whitelisted domain.
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {users.map(u => {
              const isOpen = expandedId === u.id;
              const current = u.permissions ?? roleDefaults[u.role] ?? roleDefaults.reporter;
              const isOverridden = Array.isArray(u.permissions);

              return (
                <li key={u.id} className={flashId === u.id ? 'bg-emerald-50/40' : ''}>
                  <div className="px-5 py-4 flex items-center gap-4">
                    {u.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.photo} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-xs font-bold text-brand-700 flex-shrink-0">
                        {(u.name || u.email || '?').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink-900 truncate">{u.name || u.email}</div>
                      <div className="text-xs text-ink-500 truncate">{u.email}</div>
                    </div>

                    {/* Active toggle */}
                    <label className="flex items-center gap-1.5 text-xs text-ink-600">
                      <input
                        type="checkbox"
                        checked={u.active}
                        disabled={pending}
                        onChange={e => run(() => toggleUserActiveAction(u.id, e.target.checked))}
                      />
                      Active
                    </label>

                    {/* Role select */}
                    <select
                      value={u.role}
                      disabled={pending}
                      onChange={e => {
                        const fd = new FormData();
                        fd.set('role', e.target.value);
                        setFlashId(u.id);
                        run(() => updateUserRoleAction(u.id, fd));
                      }}
                      className="px-3 py-1.5 border border-ink-200 rounded text-sm bg-white"
                    >
                      {Object.keys(roleDefaults).map(r => (
                        <option key={r} value={r} className="capitalize">{r}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setExpandedId(isOpen ? null : u.id)}
                      className="text-xs font-semibold text-brand-700 hover:underline"
                    >
                      {isOpen ? 'Collapse' : isOverridden ? 'Custom perms' : 'Permissions'}
                    </button>
                  </div>

                  {isOpen && (
                    <PermissionsForm
                      user={u}
                      modules={modules}
                      current={current}
                      overridden={isOverridden}
                      pending={pending}
                      onSave={(perms) => {
                        const fd = new FormData();
                        perms.forEach(p => fd.append('permissions', p));
                        setFlashId(u.id);
                        run(() => updateUserPermissionsAction(u.id, fd));
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function PermissionsForm({ user, modules, current, overridden, pending, onSave }) {
  const [perms, setPerms] = useState(new Set(current));
  const dirty = [...perms].sort().join(',') !== [...current].sort().join(',');

  function toggle(key) {
    setPerms(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <div className="px-5 pb-4 pt-1 bg-ink-50/60 border-t border-ink-100">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-ink-600">
          {overridden
            ? <><strong>Custom override</strong> — this user has explicit permissions that diverge from the role default.</>
            : <><strong>Using role defaults</strong> — checking a box creates an override; unchecking ones the role allows takes them away.</>}
        </div>
        <button
          disabled={pending || !dirty}
          onClick={() => onSave([...perms])}
          className="px-4 py-1.5 bg-brand-700 text-white text-xs font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save permissions'}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
        {modules.map(m => (
          <label key={m.key} className="flex items-start gap-2 text-xs text-ink-700 cursor-pointer hover:bg-white rounded px-2 py-1">
            <input
              type="checkbox"
              checked={perms.has(m.key)}
              onChange={() => toggle(m.key)}
              className="mt-0.5"
            />
            <span>
              <span className="mr-1">{m.icon}</span>
              <span className="font-semibold">{m.label}</span>
              <span className="block text-[11px] text-ink-500">{m.description}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
