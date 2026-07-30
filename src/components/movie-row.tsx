import type { MovieSummary } from '@/lib/tmdb';
import MovieCard from '@/components/movie-card';

export default function MovieRow({ title, movies }: { title: string; movies: MovieSummary[] }) {
  return (
    <section aria-labelledby={`row-${title.toLowerCase().replaceAll(' ', '-')}`} className="animate-rise-in py-5 sm:py-7">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id={`row-${title.toLowerCase().replaceAll(' ', '-')}`} className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="scrollbar-hide mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:gap-4 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-6 lg:overflow-visible lg:px-8 xl:mx-auto">
        {movies.slice(0, 12).map((movie) => (
          <div key={movie.id} className="w-[42vw] max-w-[180px] shrink-0 snap-start lg:w-auto">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </section>
  );
}
