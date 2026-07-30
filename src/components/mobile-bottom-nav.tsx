'use client';

import Link from 'next/link';
import { Bookmark, Clapperboard, Compass, Settings, Sparkles, UserPlus } from 'lucide-react';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/for-you', label: 'Picks', icon: Sparkles },
  { href: '/', label: 'Cinema', icon: Clapperboard },
  { href: '/search', label: 'Explore', icon: Compass },
  { href: '/my-movies', label: 'My List', icon: Bookmark },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export default function MobileBottomNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="safe-bottom fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#0d0b11]/95 px-2 pt-2 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === href : pathname.startsWith(href);
          const ownerInvite = isOwner && label === 'Settings';
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-bold transition ${
                active ? 'bg-violet-500/15 text-violet-300' : 'text-zinc-500 active:bg-white/5 active:text-white'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
              {ownerInvite ? <UserPlus className="absolute right-2 top-1.5 h-3 w-3 text-violet-400" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
