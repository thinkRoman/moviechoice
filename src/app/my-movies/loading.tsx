import SiteHeader from '@/components/site-header';

export default function MyMoviesLoading() {
  return (
    <main className="min-h-screen animate-pulse bg-[#08090d] text-white">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8">
        <div className="h-3 w-28 rounded bg-zinc-900" />
        <div className="mt-5 h-14 w-72 rounded bg-zinc-900" />
        <div className="mt-16 h-8 w-40 rounded bg-zinc-900" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[2/3] rounded-2xl bg-zinc-900" />)}
        </div>
      </div>
    </main>
  );
}
