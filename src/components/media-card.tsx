import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import type { DiscoverTitle, MovieSummary } from '@/lib/tmdb';
import LibraryActions from '@/components/library-actions';

type MediaCardTitle = Pick<
  MovieSummary | DiscoverTitle,
  'id' | 'title' | 'posterUrl' | 'posterPath' | 'year' | 'rating'
> & { mediaType?: 'movie' | 'tv' };

export default function MediaCard({
  title,
  priority = false,
}: {
  title: MediaCardTitle;
  priority?: boolean;
}) {
  const mediaType = title.mediaType || 'movie';
  const href = mediaType === 'tv' ? `/shows/${title.id}` : `/movies/${title.id}`;

  return (
    <article className="group relative min-w-0">
      <LibraryActions
        compact
        movie={{
          tmdbMovieId: title.id,
          mediaType,
          title: title.title,
          posterPath: title.posterPath,
          releaseYear: title.year,
        }}
      />
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 shadow-lg shadow-black/20 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-violet-950/30 group-focus-visible:-translate-y-1">
          {title.posterUrl ? (
            <Image
              src={title.posterUrl}
              alt={`${title.title} poster`}
              fill
              priority={priority}
              sizes="(max-width: 640px) 42vw, (max-width: 1024px) 24vw, 180px"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 px-4 text-center text-sm text-zinc-500">
              Poster unavailable
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition group-hover:opacity-100" />
          <span className="absolute left-2 top-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-200">
            {mediaType === 'tv' ? 'Show' : 'Movie'}
          </span>
        </div>
        <h3 className="mt-3 truncate text-sm font-semibold text-zinc-100">{title.title}</h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
          <span>{title.year || 'New'}</span>
          {title.rating > 0 ? (
            <>
              <span className="text-zinc-700">•</span>
              <span className="flex items-center gap-1 text-zinc-300">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {title.rating.toFixed(1)}
              </span>
            </>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
