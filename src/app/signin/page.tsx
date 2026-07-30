'use client';

import { FormEvent, useEffect, useState } from 'react';
import { KeyRound, Mail } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/');
  }, [router, status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const result = await signIn('credentials', {
      email,
      pin,
      redirect: false,
    });
    setLoading(false);
    if (result?.ok) {
      window.location.href = '/';
      return;
    }
    setMessage('Invalid email or PIN.');
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#18181b] p-7 shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-xl font-bold text-white">
          M
        </div>
        <h1 className="text-center text-2xl font-bold">Welcome to MovieChoice</h1>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Sign in with the email and PIN from your invitation.
        </p>

        {message && (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {message}
          </p>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-500">Email</span>
            <span className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 dark:border-gray-700 dark:bg-gray-800">
              <Mail className="h-4 w-4 text-gray-400" />
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent py-3 text-sm outline-none"
                placeholder="you@example.com"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-500">6-digit PIN</span>
            <span className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 dark:border-gray-700 dark:bg-gray-800">
              <KeyRound className="h-4 w-4 text-gray-400" />
              <input
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-transparent py-3 text-lg tracking-[0.35em] outline-none"
                placeholder="••••••"
              />
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-purple-600 py-3.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-gray-400">
          MovieChoice is invite-only. Contact the owner if you need access.
        </p>
      </div>
    </main>
  );
}
