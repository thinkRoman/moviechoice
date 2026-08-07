'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { KeyRound, Mail } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function safeCallbackUrl(value: string | null): string {
  if (!value) return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

function SignInForm() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'));

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
      router.refresh();
    }
  }, [router, status, callbackUrl]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        pin,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setMessage('Invalid email or PIN.');
        return;
      }
      if (result?.ok) {
        // Full navigation so server components (Picks) see the new session cookie.
        window.location.assign(callbackUrl);
        return;
      }
      setMessage('Could not sign in. Please try again.');
    } catch {
      setMessage('Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f3eefc_0%,#fbfaff_100%)] px-6 text-zinc-900">
      <div className="w-full max-w-sm rounded-3xl border border-violet-100 bg-white p-7 shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-xl font-bold text-white">
          M
        </div>
        <h1 className="text-center text-2xl font-bold">Welcome to MovieChoice</h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Sign in with the email and PIN from your invitation.
        </p>

        {message ? (
          <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-600">
            {message}
          </p>
        ) : null}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Email</span>
            <span className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3">
              <Mail className="h-4 w-4 text-zinc-400" />
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
            <span className="mb-1.5 block text-xs font-semibold text-zinc-500">6-digit PIN</span>
            <span className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3">
              <KeyRound className="h-4 w-4 text-zinc-400" />
              <input
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={6}
                required
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-transparent py-3 text-lg tracking-[0.35em] outline-none"
                placeholder="••••••"
                aria-invalid={pin.length > 0 && pin.length !== 6}
              />
            </span>
          </label>
          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-zinc-400">
          MovieChoice is invite-only. Contact the owner if you need access.
        </p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-zinc-500">Loading…</main>}>
      <SignInForm />
    </Suspense>
  );
}
