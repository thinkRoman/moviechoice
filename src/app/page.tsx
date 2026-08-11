import { redirect } from 'next/navigation';
import FeaturedHero from '@/components/featured-hero';
import MovieRow from '@/components/movie-row';
import RecentlyViewed from '@/components/recently-viewed';
import SiteHeader from '@/components/site-header';
import WhatsNewOnStreaming from '@/components/whats-new-on-streaming';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { getHomeMovies } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();

  // Check if new user needs onboarding
  if (session?.user?.id) {
    try {
      await dbConnect();
      const profile = await Profile.findOne({ userId: session.user.id })
        .select('onboardingCompletedAt preferences.recommendation.providerIds')
        .lean();
      if (
        profile &&
        !profile.onboardingCompletedAt &&
        (!profile.preferences?.recommendation?.providerIds ||
          profile.preferences.recommendation.providerIds.length === 0)
      ) {
        redirect('/onboarding');
      }
    } catch {
      // If DB is unavailable, show the home page normally.
    }
  }

  const { trending, popular, topRated, upcoming } = await getHomeMovies();
  const featured = trending[0];

  return (
    <main className="min-h-screen overflow-hidden bg-[#08090d] text-white">
      <SiteHeader />
      {featured ? <FeaturedHero movie={featured} /> : null}
      <div className="relative z-10 -mt-4 pb-16 sm:-mt-16">
        <MovieRow title="Trending Now" movies={trending} />
        <RecentlyViewed />
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
