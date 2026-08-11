'use client';

import { useEffect } from 'react';
import { recordView } from '@/lib/recently-viewed';

export default function RecentlyViewedTracker({
  id,
  mediaType,
  title,
  posterUrl,
  posterPath,
  year,
  rating,
}: {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterUrl: string | null;
  posterPath: string | null;
  year: string | null;
  rating: number;
}) {
  useEffect(() => {
    recordView({ id, mediaType, title, posterUrl, posterPath, year, rating });
  }, [id, mediaType, title, posterUrl, posterPath, year, rating]);

  return null;
}
