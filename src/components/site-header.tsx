import Link from 'next/link';
import { Search, Settings, Sparkles } from 'lucide-react';

export default function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#08090d]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-lg font-black tracking-tight text-white">
          MOVIE<span className="text-violet-400">CHOICE</span>
        </Link>
        <Link href="/my-movies" className="hidden shrink-0 text-sm font-semibold text-zinc-300 transition hover:text-white sm:block">
          My Movies
        </Link>
        <Link href="/for-you" className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-violet-300 transition hover:text-white sm:flex">
          <Sparkles className="h-3.5 w-3.5" /> For You
        </Link>
        <Link href="/settings" aria-label="Personalization settings" className="hidden shrink-0 text-zinc-400 transition hover:text-white sm:block">
          <Settings className="h-4 w-4" />
        </Link>
        <form action="/search" className="relative ml-auto w-full max-w-sm">
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
        <Link href="/for-you" aria-label="Recommendations for you" className="shrink-0 text-violet-300 sm:hidden">
          <Sparkles className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
