/**
 * Recently viewed items — stored in localStorage.
 * Max 20 items, deduplicated by key, most recent first.
 */

const STORAGE_KEY = 'moviechoice:recently-viewed';
const MAX_ITEMS = 20;

export interface RecentItem {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterUrl: string | null;
  posterPath: string | null;
  year: string | null;
  rating: number;
  viewedAt: number; // Date.now()
}

function readStorage(): RecentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: RecentItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — silently ignore.
  }
}

/** Record a view. Deduplicates by id+mediaType, moves to top. */
export function recordView(item: Omit<RecentItem, 'viewedAt'>) {
  const items = readStorage();
  const key = `${item.mediaType}:${item.id}`;
  const filtered = items.filter((i) => `${i.mediaType}:${i.id}` !== key);
  const updated = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
  writeStorage(updated);
}

/** Get recently viewed items, most recent first. */
export function getRecentlyViewed(limit = 10): RecentItem[] {
  return readStorage().slice(0, limit);
}

/** Clear all recently viewed items. */
export function clearRecentlyViewed() {
  writeStorage([]);
}
