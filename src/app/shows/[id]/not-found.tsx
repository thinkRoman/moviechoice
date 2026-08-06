import Link from 'next/link';

export default function ShowNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#08090d] px-4 text-center text-white">
      <h1 className="text-3xl font-black">Show not found</h1>
      <p className="mt-3 max-w-md text-zinc-400">That title may have moved, or TMDB does not have details for it.</p>
      <Link href="/for-you" className="mt-6 rounded-full bg-violet-500 px-5 py-3 text-sm font-bold">
        Back to Picks
      </Link>
    </main>
  );
}
