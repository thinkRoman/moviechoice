import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clock3, Play, Star } from 'lucide-react';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import { getMovieDetails } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

function runtimeLabel(runtime: number | null): string {
  if (!runtime) return 'Runtime unavailable';
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default async function MovieDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await getMovieDetails(id);
  if (!movie) notFound();

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <SiteHeader />
      <section className="relative min-h-[62svh] overflow-hidden pt-16 sm:min-h-[720px]">
        {movie.backdropUrl ? (
          <Image src={movie.backdropUrl} alt="" fill priority sizes="100vw" className="object-cover object-center" />
        ) : null}
        <div className="absolute inset-0 bg-[#08090d]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/60 to-[#08090d]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090d]/90 via-transparent to-transparent" />

        <div className="relative mx-auto flex min-h-[62svh] max-w-7xl items-end px-4 pb-10 sm:min-h-[720px] sm:px-6 sm:pb-16 lg:px-8">
          <div className="grid w-full items-end gap-7 sm:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="relative hidden aspect-[2/3] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/15 sm:block">
              {movie.posterUrl ? (
                <Image src={movie.posterUrl} alt={`${movie.title} poster`} fill priority sizes="280px" className="object-cover" />
              ) : null}
            </div>
            <div className="max-w-3xl">
              <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm text-zinc-300 transition hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back to discover
              </Link>
              <h1 className="text-4xl font-black leading-none tracking-[-0.04em] sm:text-6xl">{movie.title}</h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-300">
                <span>{movie.year || 'Release date unavailable'}</span>
                <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{runtimeLabel(movie.runtime)}</span>
                {movie.rating > 0 ? (
                  <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{movie.rating.toFixed(1)} / 10</span>
                ) : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span key={genre} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">{genre}</span>
                ))}
              </div>
              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
                {movie.overview || 'No overview is available for this movie yet.'}
              </p>
              {movie.trailerUrl ? (
                <a href={movie.trailerUrl} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-sm font-bold transition hover:bg-violet-400">
                  <Play className="h-4 w-4 fill-current" /> Watch trailer
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold">Top cast</h2>
        {movie.cast.length ? (
          <div className="scrollbar-hide mt-5 flex gap-4 overflow-x-auto pb-4">
            {movie.cast.map((person) => (
              <article key={person.id} className="w-28 shrink-0 sm:w-36">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10">
                  {person.profileUrl ? (
                    <Image src={person.profileUrl} alt={person.name} fill sizes="144px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-3 text-center text-xs text-zinc-600">Photo unavailable</div>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-semibold">{person.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{person.character}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-zinc-500">Cast information is not available yet.</p>
        )}
      </section>
    </main>
  );
}
