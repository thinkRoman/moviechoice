'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, UserPlus } from 'lucide-react';
import type { SafeAccessUser } from '@/lib/access';

export default function UserAccessClient() {
  const [users, setUsers] = useState<SafeAccessUser[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadUsers() {
    const response = await fetch('/api/settings/user-access', { cache: 'no-store' });
    if (response.ok) setUsers((await response.json()).users);
  }

  useEffect(() => {
    fetch('/api/settings/user-access', { cache: 'no-store' })
      .then(async (response) => {
        if (response.ok) setUsers((await response.json()).users);
      })
      .catch(() => setMessage('Could not load users.'));
  }, []);

  async function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const response = await fetch('/api/settings/user-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const body = await response.json();
    setBusy(false);
    setMessage(response.ok ? 'User added and PIN emailed.' : body.error);
    if (response.ok) {
      setName('');
      setEmail('');
      await loadUsers();
    }
  }

  async function setStatus(user: SafeAccessUser) {
    setBusy(true);
    const status = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const response = await fetch(`/api/settings/user-access/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setMessage(response.ok ? `User ${status === 'ACTIVE' ? 'reactivated' : 'suspended'}.` : 'Could not update user.');
    setBusy(false);
    if (response.ok) await loadUsers();
  }

  async function regenerate(user: SafeAccessUser) {
    setBusy(true);
    const response = await fetch(`/api/settings/user-access/${user.id}/regenerate-pin`, {
      method: 'POST',
    });
    setMessage(response.ok ? 'A new PIN was emailed.' : 'Could not regenerate PIN.');
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-[#0a0a0a] dark:text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/settings" className="mb-6 inline-flex items-center gap-2 text-sm text-purple-600">
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>
        <h1 className="text-3xl font-bold">User Access</h1>
        <p className="mt-1 text-sm text-gray-500">
          Invite people with a PIN. Each member gets their own picks, watched list, and settings.
        </p>

        <form onSubmit={addUser} className="mt-7 grid gap-3 rounded-2xl border bg-white p-5 dark:border-gray-800 dark:bg-[#18181b] sm:grid-cols-2">
          <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="rounded-xl border bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800" />
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="rounded-xl border bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800" />
          <button disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">
            <UserPlus className="h-4 w-4" /> Add user and email PIN
          </button>
        </form>

        {message && <p className="mt-4 rounded-xl bg-purple-50 px-4 py-3 text-sm text-purple-700 dark:bg-purple-950/30 dark:text-purple-300">{message}</p>}

        <div className="mt-6 space-y-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-2xl border bg-white p-4 dark:border-gray-800 dark:bg-[#18181b]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="mt-1 text-xs text-gray-400">{user.role} · {user.status}</p>
                </div>
                {user.role === 'MEMBER' && (
                  <div className="flex flex-wrap justify-end gap-2">
                    <button disabled={busy} onClick={() => void regenerate(user)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs">
                      <RefreshCw className="h-3 w-3" /> Resend PIN
                    </button>
                    <button disabled={busy} onClick={() => void setStatus(user)} className="rounded-lg border px-3 py-2 text-xs">
                      {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
