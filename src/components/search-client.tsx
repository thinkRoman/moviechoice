'use client';

import { Search, Sparkles, Tv } from 'lucide-react';
import { useCallback, useState } from 'react';
import MovieCard from '@/components/movie-card';
import type { MovieSummary } from '@/lib/tmdb';

interface SearchResult extends MovieSummary {
  availableOnUserServices?: boolean;
  availableProviders?: string[];
}

interface SearchResponse {
  movies: SearchResult[];
  page: number;
  totalPages: number;
  totalResults: number;
  error?: string;
}

export default function SearchClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [submitted, setSubmitted] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterStreaming, setFilterStreaming] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery));

  const doSearch = useCallback(async (q: string, filter: boolean) => {
    if (!q.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ q: q.trim() });
      if (filter) params.set('filterStreaming', 'true');
      const response = await fetch(`/api/search?${params}`);
      const data = await response.json() as SearchResponse;
      if (!response.ok) throw new Error(data.error || 'Search failed');
      setResults(data.movies || []);
      setTotalResults(data.totalResults || 0);
    } catch {
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(query.trim());
    setHasSearched(true);
    doSearch(query, filterStreaming);
  }

  function toggleFilter() {
    const next = !filterStreaming;
    setFilterStreaming(next);
    if (submitted) doSearch(submitted, next);
  }

  const streamingCount = results.filter((m) => m.availableOnUserServices).length;

  return (
    <form onSubmit={handleSubmit} className="relative mt-8 max-w-2xl">
      <label htmlFor="movie-search" className="sr-only">Search by movie title</label>
      <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
      <input
        id="movie-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        placeholder='Try "The Godfather"'
        className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-14 pr-28 text-base outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10"
      />
      <button type="submit" className="absolute right-2 top-2 h-10 rounded-xl bg-violet-500 px-5 text-sm font-bold transition hover:bg-violet-400">
        Search
      </button>

      {hasSearched && !loading && results.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleFilter}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
              filterStreaming
                ? 'border-violet-400/60 bg-violet-500/20 text-violet-100'
                : 'border-white/10 bg-white/[0.035] text-zinc-400 hover:border-white/20 hover:text-white'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            On my services
            {filterStreaming && streamingCount > 0 && (
              <span className="ml-1 rounded-full bg-violet-500/30 px-1.5 text-[10px]">{streamingCount}</span>
            )}
          </button>
        </div>
      )}

      {!hasSearched ? (
        <div className="mt-20 flex max-w-lg flex-col items-start">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-bold">A whole world of movies awaits</h2>
          <p className="mt-2 leading-7 text-zinc-500">
            Search by title to discover cast, trailers, ratings, and everything you need to choose tonight&apos;s movie.
          </p>
        </div>
      ) : loading ? (
        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-zinc-900/80 ring-1 ring-white/5" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-20 max-w-lg rounded-3xl border border-rose-200 bg-rose-50/10 p-8">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="mt-12 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Results for &ldquo;{submitted}&rdquo;
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {totalResults.toLocaleString()} movies found
                {filterStreaming && ` · ${streamingCount} on your services`}
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((movie, index) => (
              <div key={movie.id} className="relative">
                <MovieCard movie={movie} priority={index < 4} />
                {movie.availableOnUserServices && (
                  <div className="absolute bottom-20 left-2 z-10 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                    On {movie.availableProviders?.[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-20 max-w-lg rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <Search className="h-8 w-8 text-zinc-600" />
          <h2 className="mt-5 text-xl font-bold">No movies found</h2>
          <p className="mt-2 leading-7 text-zinc-500">
            We couldn&apos;t find &ldquo;{submitted}&rdquo;. Check the spelling or try a shorter movie title.
          </p>
        </div>
      )}
    </form>
  );
}
