import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Fraunces, Outfit } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { LibraryProvider } from '@/components/library-provider';
import PwaRegister from '@/components/pwa-register';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'MovieChoice — Discover your next great movie',
    template: '%s — MovieChoice',
  },
  description:
    'Eliminate streaming decision fatigue with personalized movie and show picks for your family.',
  applicationName: 'MovieChoice',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MovieChoice',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3eefc' },
    { media: '(prefers-color-scheme: dark)', color: '#08090d' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${outfit.variable} ${fraunces.variable} font-sans antialiased touch-manipulation`}>
        <SessionProvider refetchOnWindowFocus refetchWhenOffline={false}>
          <LibraryProvider>
            {children}
            <PwaRegister />
          </LibraryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
