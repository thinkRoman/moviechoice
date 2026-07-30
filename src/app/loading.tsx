export default function HomeLoading() {
  return (
    <main className="min-h-screen animate-pulse bg-[#08090d]">
      <div className="h-[76svh] bg-zinc-900">
        <div className="mx-auto flex h-full max-w-7xl items-end px-4 pb-16 sm:px-6 lg:px-8">
          <div className="w-full max-w-xl">
            <div className="h-3 w-40 rounded bg-zinc-800" />
            <div className="mt-5 h-16 rounded bg-zinc-800" />
            <div className="mt-5 h-24 rounded bg-zinc-800" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-7 w-40 rounded bg-zinc-900" />
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[2/3] rounded-2xl bg-zinc-900" />)}
        </div>
      </div>
    </main>
  );
}
