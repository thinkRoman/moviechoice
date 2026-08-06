'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Mail, RefreshCw, UserPlus, UserRound } from 'lucide-react';
import type { SafeAccessUser } from '@/lib/access';

export default function UserAccessClient() {
  const [users, setUsers] = useState<SafeAccessUser[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadUsers() {
    const response = await fetch('/api/settings/user-access', {
      cache: 'no-store',
      credentials: 'include',
    });
    if (response.ok) setUsers((await response.json()).users);
  }

  useEffect(() => {
    fetch('/api/settings/user-access', { cache: 'no-store', credentials: 'include' })
      .then(async (response) => {
        if (response.ok) setUsers((await response.json()).users);
        else setMessage('Could not load users.');
      })
      .catch(() => setMessage('Could not load users.'));
  }, []);

  async function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pin.length !== 6) {
      setMessage('Enter a 6-digit PIN to email with the invite.');
      return;
    }
    setBusy(true);
    setMessage('');
    const response = await fetch('/api/settings/user-access', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), pin }),
    });
    const body = await response.json().catch(() => ({})) as { error?: string };
    setBusy(false);
    setMessage(response.ok ? 'User added — PIN emailed via Resend.' : (body.error || 'Could not invite user.'));
    if (response.ok) {
      setName('');
      setEmail('');
      setPin('');
      await loadUsers();
    }
  }

  async function setStatus(user: SafeAccessUser) {
    setBusy(true);
    const status = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const response = await fetch(`/api/settings/user-access/${user.id}`, {
      method: 'PATCH',
      credentials: 'include',
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
      credentials: 'include',
    });
    setMessage(response.ok ? 'A new PIN was emailed.' : 'Could not regenerate PIN.');
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-4 pb-28 pt-6 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/settings" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>

        <h1 className="font-serif text-4xl font-bold tracking-tight">User Access</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
          Invite people with name, email, and a 6-digit PIN. We email that PIN via Resend. Each member gets their own picks, watched list, and settings.
        </p>

        <form
          onSubmit={addUser}
          className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Name</span>
            <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3">
              <UserRound className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Alex"
                className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Email</span>
            <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3">
              <Mail className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">6-digit PIN</span>
            <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3">
              <KeyRound className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                required
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full bg-transparent py-3.5 text-sm tracking-[0.35em] text-white outline-none placeholder:tracking-normal placeholder:text-zinc-600"
              />
            </span>
            <span className="mt-1.5 block text-xs text-zinc-500">This PIN is emailed to them and used to sign in.</span>
          </label>

          <button
            type="submit"
            disabled={busy || pin.length !== 6}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {busy ? 'Sending invite…' : 'Add user and email PIN'}
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-2xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
            {message}
          </p>
        ) : null}

        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-500">People</h2>
          {users.map((user) => (
            <div key={user.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{user.name}</p>
                  <p className="truncate text-sm text-zinc-400">{user.email}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {user.role} · {user.status}
                  </p>
                </div>
                {user.role === 'MEMBER' ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void regenerate(user)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-zinc-200 disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" /> Resend new PIN
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setStatus(user)}
                      className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-zinc-200 disabled:opacity-50"
                    >
                      {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
