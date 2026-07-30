import SiteHeader from '@/components/site-header';

export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <SiteHeader />
      <div className="mx-auto max-w-7xl animate-pulse px-4 pt-28 sm:px-6 lg:px-8">
        <div className="h-3 w-24 rounded bg-zinc-800" />
        <div className="mt-5 h-10 w-80 max-w-full rounded bg-zinc-800" />
        <div className="mt-8 h-14 max-w-2xl rounded-2xl bg-zinc-900" />
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index}>
              <div className="aspect-[2/3] rounded-2xl bg-zinc-900" />
              <div className="mt-3 h-4 rounded bg-zinc-900" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
