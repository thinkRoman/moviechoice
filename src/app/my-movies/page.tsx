import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, Eye, Heart } from 'lucide-react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import SiteHeader from '@/components/site-header';
import { listLibrary, type LibraryItem } from '@/lib/movie-library';
import { movieLibraryRepository } from '@/lib/movie-library-repository';

export const dynamic = 'force-dynamic';

function LibraryCard({ item, showWatchedAt = false }: { item: LibraryItem; showWatchedAt?: boolean }) {
  const posterUrl = item.posterPath
    ? `https://image.tmdb.org/t/p/w500${item.posterPath}`
    : null;

  return (
    <Link href={`/movies/${item.tmdbMovieId}`} className="group block min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-violet-400/40">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={`${item.title} poster`}
            fill
            sizes="(max-width: 640px) 44vw, (max-width: 1024px) 25vw, 180px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-600">Poster unavailable</div>
        )}
      </div>
      <h3 className="mt-3 truncate text-sm font-semibold text-white">{item.title}</h3>
      <p className="mt-1 text-xs text-zinc-500">
        {showWatchedAt && item.watchedAt
          ? `Watched ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(item.watchedAt))}`
          : item.releaseYear || 'Release year unavailable'}
      </p>
    </Link>
  );
}

function LibrarySection({
  id,
  title,
  description,
  icon: Icon,
  items,
  showWatchedAt = false,
}: {
  id: string;
  title: string;
  description: string;
  icon: typeof Bookmark;
  items: LibraryItem[];
  showWatchedAt?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-8 sm:py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </div>
      </div>
      {items.length ? (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => <LibraryCard key={item.id} item={item} showWatchedAt={showWatchedAt} />)}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.025] px-6 py-10 text-center">
          <p className="font-semibold text-zinc-300">Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
            Discover a movie and use its library actions to add it here.
          </p>
          <Link href="/" className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-zinc-950">
            Explore movies
          </Link>
        </div>
      )}
    </section>
  );
}

export default async function MyMoviesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin');

  const items = await listLibrary(session.user.id, movieLibraryRepository);
  const watchlist = items.filter((item) => item.inWatchlist);
  const watched = items.filter((item) => item.watched);
  const favorites = items.filter((item) => item.favorite);

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-400">Your collection</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">My Movies</h1>
        <p className="mt-4 max-w-xl leading-7 text-zinc-500">
          Everything you want to watch, everything you’ve seen, and the movies you love most.
        </p>
        <nav className="scrollbar-hide mt-8 flex gap-2 overflow-x-auto">
          {[
            ['watchlist', 'Watchlist', watchlist.length],
            ['watched', 'Watched', watched.length],
            ['favorites', 'Favorites', favorites.length],
          ].map(([id, label, count]) => (
            <a key={String(id)} href={`#${id}`} className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300">
              {label} <span className="ml-1 text-zinc-600">{count}</span>
            </a>
          ))}
        </nav>
        <LibrarySection id="watchlist" title="Watchlist" description="Movies saved for later." icon={Bookmark} items={watchlist} />
        <LibrarySection id="watched" title="Watched" description="Your viewing history." icon={Eye} items={watched} showWatchedAt />
        <LibrarySection id="favorites" title="Favorites" description="The ones worth remembering." icon={Heart} items={favorites} />
      </div>
    </main>
  );
}
