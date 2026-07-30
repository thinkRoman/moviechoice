import SiteHeader from '@/components/site-header';

export default function MovieLoading() {
  return (
    <main className="min-h-screen animate-pulse bg-[#08090d] text-white">
      <SiteHeader />
      <div className="mx-auto grid min-h-[720px] max-w-7xl items-end gap-8 px-4 pb-16 pt-28 sm:grid-cols-[220px_1fr] sm:px-6 lg:px-8">
        <div className="hidden aspect-[2/3] rounded-3xl bg-zinc-900 sm:block" />
        <div className="pb-4">
          <div className="h-14 max-w-xl rounded bg-zinc-900" />
          <div className="mt-5 h-5 w-64 rounded bg-zinc-900" />
          <div className="mt-6 h-24 max-w-2xl rounded bg-zinc-900" />
        </div>
      </div>
    </main>
  );
}
