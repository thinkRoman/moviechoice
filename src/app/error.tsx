'use client';

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090d] px-4 text-white">
      <div className="max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-400">Connection interrupted</p>
        <h1 className="mt-4 text-4xl font-black">The movies are taking five</h1>
        <p className="mt-4 leading-7 text-zinc-500">We couldn’t reach the movie catalog. Give it another moment and try again.</p>
        <button onClick={reset} className="mt-7 rounded-full bg-white px-6 py-3 text-sm font-bold text-zinc-950">Try again</button>
      </div>
    </main>
  );
}
