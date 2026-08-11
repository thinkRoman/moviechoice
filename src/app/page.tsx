import FeaturedHero from '@/components/featured-hero';
import MovieRow from '@/components/movie-row';
import SiteHeader from '@/components/site-header';
import WhatsNewOnStreaming from '@/components/whats-new-on-streaming';
import { getHomeMovies } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { trending, popular, topRated, upcoming } = await getHomeMovies();
  const featured = trending[0];

  return (
    <main className="min-h-screen overflow-hidden bg-[#08090d] text-white">
      <SiteHeader />
      {featured ? <FeaturedHero movie={featured} /> : null}
      <div className="relative z-10 -mt-4 pb-16 sm:-mt-16">
        <MovieRow title="Trending Now" movies={trending} />
        <WhatsNewOnStreaming />
        <MovieRow title="Popular" movies={popular} />
        <MovieRow title="Top Rated" movies={topRated} />
        <MovieRow title="Coming Soon" movies={upcoming} />
      </div>
      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-zinc-600">
        Movie data and imagery provided by TMDB.
      </footer>
    </main>
  );
}
