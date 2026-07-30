import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import type { MovieSummary } from '@/lib/tmdb';

export default function FeaturedHero({ movie }: { movie: MovieSummary }) {
  return (
    <section className="relative min-h-[76svh] overflow-hidden pt-16 sm:min-h-[680px]">
      {movie.backdropUrl ? (
        <Image
          src={movie.backdropUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="animate-cinematic-in object-cover object-center"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-[#08090d]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/10 to-[#08090d]/30" />
      <div className="relative mx-auto flex min-h-[76svh] max-w-7xl items-end px-4 pb-16 sm:min-h-[680px] sm:items-center sm:px-6 sm:pb-0 lg:px-8">
        <div className="animate-rise-in max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-violet-300">
            #1 trending this week
          </p>
          <h1 className="text-4xl font-black leading-[0.95] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            {movie.title}
          </h1>
          <div className="mt-5 flex items-center gap-3 text-sm text-zinc-300">
            <span>{movie.year}</span>
            <span className="h-1 w-1 rounded-full bg-zinc-500" />
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {movie.rating.toFixed(1)}
            </span>
          </div>
          <p className="animation-delay-150 animate-rise-in mt-5 line-clamp-3 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base sm:leading-7">
            {movie.overview || 'Discover the movie everyone is talking about this week.'}
          </p>
          <Link
            href={`/movies/${movie.id}`}
            className="animation-delay-300 animate-rise-in mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-zinc-950 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-violet-200 hover:shadow-violet-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            View movie <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
