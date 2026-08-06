import './globals.css';
import type { Metadata } from 'next';
import { Fraunces, Outfit } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { LibraryProvider } from '@/components/library-provider';

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
    'Discover trending, popular, top-rated, and upcoming movies.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#7c3aed',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${outfit.variable} ${fraunces.variable} font-sans antialiased`}>
        <SessionProvider>
          <LibraryProvider>{children}</LibraryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
