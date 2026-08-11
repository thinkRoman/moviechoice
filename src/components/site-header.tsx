import Link from 'next/link';
import { Search, Settings, Sparkles, UserPlus } from 'lucide-react';
import { auth } from '@/lib/auth';
import MobileBottomNav from '@/components/mobile-bottom-nav';
import SignOutButton from '@/components/sign-out-button';

export default async function SiteHeader() {
  const session = await auth();
  const isOwner = session?.user?.role === 'OWNER';

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#08090d]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-lg font-black tracking-tight text-white">
          MOVIE<span className="text-violet-400">CHOICE</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <Link href="/my-movies" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:text-white">
            My Movies
          </Link>
          <Link href="/for-you" className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-violet-300 transition hover:text-white">
            <Sparkles className="h-3.5 w-3.5" /> Picks
          </Link>
          <Link href="/settings" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:text-white">
            Settings
          </Link>
          {isOwner ? (
            <Link href="/settings/user-access" className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:text-white">
              <UserPlus className="h-4 w-4" /> Invite
            </Link>
          ) : null}
        </nav>
        <form action="/search" className="relative ml-auto hidden w-full max-w-sm sm:block">
          <label htmlFor="global-movie-search" className="sr-only">Search movies</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            id="global-movie-search"
            name="q"
            type="search"
            placeholder="Search movies"
            className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-400/60 focus:bg-white/10 focus:ring-2 focus:ring-violet-500/20"
          />
        </form>
        {session?.user ? <SignOutButton className="hidden sm:flex" /> : null}
        <Link href="/settings" aria-label="Settings" className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-300 ring-1 ring-white/10 sm:hidden">
          <Settings className="h-5 w-5" />
        </Link>
        {isOwner ? (
          <Link href="/settings/user-access" aria-label="Invite and manage users" className="shrink-0 text-zinc-300 sm:hidden">
            <UserPlus className="h-5 w-5" />
          </Link>
        ) : null}
      </div>
    </header>
    {session?.user ? <MobileBottomNav isOwner={isOwner} /> : null}
    </>
  );
}
