import Link from 'next/link';

export default function MovieNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090d] px-4 text-white">
      <div className="max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-400">404</p>
        <h1 className="mt-4 text-4xl font-black">Movie not found</h1>
        <p className="mt-4 leading-7 text-zinc-500">This movie may have moved, or it isn’t available in the TMDB catalog.</p>
        <Link href="/" className="mt-7 inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-zinc-950">Back to discovery</Link>
      </div>
    </main>
  );
}
