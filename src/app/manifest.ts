import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MovieChoice',
    short_name: 'MovieChoice',
    description:
      'Personalized movie and show picks for your family — Add to Home Screen for the full iPhone app feel.',
    start_url: '/',
    display: 'standalone',
    display_override: ['standalone', 'browser'],
    background_color: '#f3eefc',
    theme_color: '#7c3aed',
    orientation: 'portrait',
    categories: ['entertainment', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
