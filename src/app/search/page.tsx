import SearchClient from '@/components/search-client';
import SiteHeader from '@/components/site-header';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q?.trim() || '';

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-400">Discover</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Find your next movie</h1>
        <SearchClient initialQuery={query} />
      </div>
    </main>
  );
}
