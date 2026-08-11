'use client';

import { Clock, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { clearRecentlyViewed, getRecentlyViewed, type RecentItem } from '@/lib/recently-viewed';

export default function RecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    setItems(getRecentlyViewed(8));
  }, []);

  if (items.length === 0) return null;

  function handleClear() {
    clearRecentlyViewed();
    setItems([]);
    setShowClear(false);
  }

  return (
    <section aria-labelledby="recently-viewed" className="animate-rise-in py-5 sm:py-7">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 id="recently-viewed" className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            <Clock className="mr-2 inline h-5 w-5 text-zinc-500" />
            Recently viewed
          </h2>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowClear((v) => !v)}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-400"
            >
              Clear
            </button>
            {showClear && (
              <div className="absolute right-0 top-8 z-50 rounded-xl border border-white/10 bg-zinc-900 p-3 shadow-xl">
                <p className="text-xs text-zinc-400">Clear all recently viewed?</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
                  >
                    Yes, clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClear(false)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="scrollbar-hide mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:gap-4 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-8 lg:overflow-visible lg:px-8 xl:mx-auto">
        {items.map((item) => {
          const href = item.mediaType === 'tv' ? `/shows/${item.id}` : `/movies/${item.id}`;
          return (
            <Link
              key={`${item.mediaType}-${item.id}`}
              href={href}
              className="group w-[38vw] max-w-[160px] shrink-0 snap-start lg:w-auto"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10 transition group-hover:-translate-y-1 group-hover:ring-white/20">
                {item.posterUrl ? (
                  <Image
                    src={item.posterUrl}
                    alt={`${item.title} poster`}
                    fill
                    sizes="(max-width: 640px) 38vw, 160px"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-600">
                    No poster
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
              <h3 className="mt-2 truncate text-xs font-semibold text-zinc-300 group-hover:text-white">{item.title}</h3>
              <p className="mt-0.5 text-[10px] text-zinc-600">{item.year || '—'}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
