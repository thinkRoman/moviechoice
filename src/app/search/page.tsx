import Link from 'next/link';
import { Search, Sparkles } from 'lucide-react';
import MovieCard from '@/components/movie-card';
import SiteHeader from '@/components/site-header';
import { searchMovies } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q?.trim() || '';
  const result = query ? await searchMovies(query) : null;

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-400">Discover</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Find your next movie</h1>

        <form action="/search" className="relative mt-8 max-w-2xl">
          <label htmlFor="movie-search" className="sr-only">Search by movie title</label>
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
          <input
            id="movie-search"
            name="q"
            type="search"
            defaultValue={query}
            autoFocus
            placeholder="Try “The Godfather”"
            className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-14 pr-28 text-base outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10"
          />
          <button className="absolute right-2 top-2 h-10 rounded-xl bg-violet-500 px-5 text-sm font-bold transition hover:bg-violet-400">
            Search
          </button>
        </form>

        {!query ? (
          <div className="mt-20 flex max-w-lg flex-col items-start">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-bold">A whole world of movies awaits</h2>
            <p className="mt-2 leading-7 text-zinc-500">
              Search by title to discover cast, trailers, ratings, and everything you need to choose tonight’s movie.
            </p>
          </div>
        ) : result && result.movies.length > 0 ? (
          <>
            <div className="mt-12 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">Results for “{query}”</h2>
                <p className="mt-1 text-sm text-zinc-500">{result.totalResults.toLocaleString()} movies found</p>
              </div>
              <Link href="/" className="text-sm font-semibold text-violet-400 hover:text-violet-300">Back home</Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {result.movies.map((movie, index) => (
                <MovieCard key={movie.id} movie={movie} priority={index < 4} />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-20 max-w-lg rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <Search className="h-8 w-8 text-zinc-600" />
            <h2 className="mt-5 text-xl font-bold">No movies found</h2>
            <p className="mt-2 leading-7 text-zinc-500">
              We couldn’t find “{query}”. Check the spelling or try a shorter movie title.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
