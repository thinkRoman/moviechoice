'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Clapperboard,
  Compass,
  MessageCircle,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Eye,
  Search,
  Film,
  Star,
  ChevronRight,
  Sparkles,
  Users,
  Heart,
  Clock,
  Settings,
  Share2,
  Smartphone,
  LogOut,
  ExternalLink,
} from 'lucide-react';

// --- Types ---
interface Title {
  id: number;
  type: 'movie' | 'show';
  title: string;
  year: number;
  rating: number;
  ratingCount: string;
  durationOrEpisodes: string;
  genres: string[];
  platforms: PlatformInfo[];
  description: string;
  posterUrl: string;
  language: string;
  subtitle: string;
  liked: boolean;
  seen: boolean;
  watchlisted: boolean;
}

interface PlatformInfo {
  id: string;
  name: string;
  color: string;
}

// --- Mock Data ---
const initialMovies: Title[] = [
  {
    id: 1,
    type: 'movie',
    title: 'Predator: Badlands',
    year: 2025,
    rating: 7.8,
    ratingCount: '3k',
    durationOrEpisodes: '1h 47m',
    genres: ['Action', 'Science Fiction'],
    platforms: [{ id: 'hulu', name: 'HULU', color: '#1ce753' }],
    description:
      'If you crave high-stakes action with sharp sci-fi tension, this Predator tale delivers brutal momentum and surprising ally dynamics.',
    posterUrl: '',
    language: 'English',
    subtitle: '',
    liked: false,
    seen: false,
    watchlisted: false,
  },
  {
    id: 2,
    type: 'movie',
    title: 'Remarkably Bright Creatures',
    year: 2024,
    rating: 8.5,
    ratingCount: '765',
    durationOrEpisodes: '1h 54m',
    genres: ['Drama', 'Mystery'],
    platforms: [{ id: 'netflix', name: 'NETFLIX', color: '#e50914' }],
    description:
      'Warm, character-driven wonder meets late-night charm — expect a heartfelt mystery that sparks hope without losing its cozy edge.',
    posterUrl: '',
    language: 'English',
    subtitle: '',
    liked: false,
    seen: false,
    watchlisted: false,
  },
  {
    id: 3,
    type: 'movie',
    title: 'F1',
    year: 2025,
    rating: 7.8,
    ratingCount: '4k',
    durationOrEpisodes: '2h 36m',
    genres: ['Action', 'Drama'],
    platforms: [{ id: 'apple-tv', name: 'APPLE TV', color: '#000000' }],
    description:
      "You'll enjoy the move moves of a returning legend, because mentorship, competition, and adrenaline-driven thrills are built to binge.",
    posterUrl: '',
    language: 'English',
    subtitle: '',
    liked: false,
    seen: false,
    watchlisted: false,
  },
  {
    id: 4,
    type: 'movie',
    title: 'The Seed of the Sacred Fig',
    year: 2024,
    rating: 7.5,
    ratingCount: '484',
    durationOrEpisodes: '2h 47m',
    genres: ['Drama', 'Thriller'],
    platforms: [{ id: 'hulu', name: 'HULU', color: '#1ce753' }],
    description:
      'For fans of tense political suspense, this delivers paranoia, sharp unease, and relationship pressure when every certainty disappears fast.',
    posterUrl: '',
    language: 'Persian',
    subtitle: 'French',
    liked: false,
    seen: false,
    watchlisted: false,
  },
];

const initialShows: Title[] = [
  {
    id: 5,
    type: 'show',
    title: 'Teach You a Lesson',
    year: 2026,
    rating: 9.4,
    ratingCount: '729',
    durationOrEpisodes: '8 Episodes',
    genres: ['Action & Adventure', 'Drama'],
    platforms: [{ id: 'netflix', name: 'NETFLIX', color: '#e50914' }],
    description:
      'Action-thriller fans will likely love this, since it blends institutional power, escalating confrontations, and unconventional discipline stakes.',
    posterUrl: '',
    language: 'Korean',
    subtitle: '',
    liked: false,
    seen: false,
    watchlisted: false,
  },
  {
    id: 6,
    type: 'show',
    title: 'The WONDERfools',
    year: 2026,
    rating: 8.9,
    ratingCount: '225',
    durationOrEpisodes: '8 Episodes',
    genres: ['Action & Adventure', 'Comedy'],
    platforms: [{ id: 'netflix', name: 'NETFLIX', color: '#e50914' }],
    description:
      'Press play for an action comedy swing — goofy heroes, escalating battles, and doomsday chaos make it a fun, fast escape.',
    posterUrl: '',
    language: 'Korean',
    subtitle: '',
    liked: false,
    seen: false,
    watchlisted: false,
  },
  {
    id: 7,
    type: 'show',
    title: 'Berlin and the Lady with an Ermine',
    year: 2026,
    rating: 8.2,
    ratingCount: '194',
    durationOrEpisodes: '6 Episodes',
    genres: ['Drama', 'Crime'],
    platforms: [{ id: 'netflix', name: 'NETFLIX', color: '#e50914' }],
    description:
      'If you like stylish heists and playful schemes, this one hooks you with a clever plot and a painting theft with real bite.',
    posterUrl: '',
    language: 'Spanish',
    subtitle: '',
    liked: false,
    seen: false,
    watchlisted: false,
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('picks');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [movies, setMovies] = useState<Title[]>(initialMovies);
  const [shows, setShows] = useState<Title[]>(initialShows);

  const allTitles = [...movies, ...shows];

  const toggleLike = (id: number) => {
    const update = (list: Title[]) =>
      list.map((t) => (t.id === id ? { ...t, liked: !t.liked } : t));
    setMovies((prev) => update(prev));
    setShows((prev) => update(prev));
  };

  const toggleSeen = (id: number) => {
    const update = (list: Title[]) =>
      list.map((t) => (t.id === id ? { ...t, seen: !t.seen } : t));
    setMovies((prev) => update(prev));
    setShows((prev) => update(prev));
  };

  const toggleWatchlist = (id: number) => {
    const update = (list: Title[]) =>
      list.map((t) => (t.id === id ? { ...t, watchlisted: !t.watchlisted } : t));
    setMovies((prev) => update(prev));
    setShows((prev) => update(prev));
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-xl mx-auto px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Movies</h1>
            </div>
            <button className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 pb-32">
        {activeTab === 'picks' && (
          <>
            {/* Quick Pick Banner */}
            <button
              onClick={() => setActiveTab('picks')}
              className="w-full mb-5 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-2xl p-4 shadow-lg shadow-purple-500/15 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Quick Pick</p>
                  <p className="text-[11px] text-purple-200">Get a recommendation in 30s</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-purple-200" />
            </button>

            {/* Movies Section */}
            <section className="mb-6">
              <h2 className="text-lg font-bold mb-3">Movies</h2>
              <div className="space-y-4">
                {movies.map((title) => (
                  <TitleCard
                    key={title.id}
                    title={title}
                    onLike={() => toggleLike(title.id)}
                    onSeen={() => toggleSeen(title.id)}
                    onWatchlist={() => toggleWatchlist(title.id)}
                  />
                ))}
              </div>
            </section>

            {/* Shows Section */}
            <section>
              <h2 className="text-lg font-bold mb-3">Shows</h2>
              <div className="space-y-4">
                {shows.map((title) => (
                  <TitleCard
                    key={title.id}
                    title={title}
                    onLike={() => toggleLike(title.id)}
                    onSeen={() => toggleSeen(title.id)}
                    onWatchlist={() => toggleWatchlist(title.id)}
                  />
                ))}
              </div>
            </section>

            {/* Footer note */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-8 mb-4">
              👍 and 👎 your Watched list shape next Friday&amp;apos;s picks. Open on Friday and it refreshes itself.
            </p>
          </>
        )}

        {activeTab === 'cinema' && <CinemaTab />}

        {activeTab === 'explore' && <ExploreTab />}

        {activeTab === 'ask' && <AskTab />}
      </main>

      {/* Floating Refresh Button */}
      <button className="fixed bottom-24 right-4 w-12 h-12 bg-[#7c3aed] text-white rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center hover:bg-[#6d28d9] transition-colors z-20 active:scale-90">
        <Sparkles className="w-5 h-5" />
      </button>

      {/* More Menu Overlay */}
      {moreMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setMoreMenuOpen(false)}
        />
      )}

      {/* More Menu Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#18181b] rounded-t-3xl shadow-2xl transition-transform duration-300 ${
          moreMenuOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '80vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* User Profile Card */}
        <div className="mx-4 mb-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 dark:text-white">Signed in as ashwani</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tap below to change your PIN</p>
            </div>
            <button className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-3 py-1.5 rounded-full">
              Switch
            </button>
          </div>
          <button className="mt-3 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
            <Settings className="w-3.5 h-3.5" />
            Change my PIN
          </button>
        </div>

        {/* Weekly Mix Card */}
        <div className="mx-4 mb-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Weekly mix</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Movies</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">4</span>
                <button className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clapperboard className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Shows</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">3</span>
                <button className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">How recent</span>
              </div>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Last 2 yrs</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="mx-4 mb-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-2 mb-2">
            <button
              onClick={() => {
                setMoreMenuOpen(false);
                setActiveTab('picks');
              }}
              className="w-full flex items-center gap-3 py-3 px-3 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium"
            >
              <Clapperboard className="w-5 h-5" />
              <span>Friday Picks</span>
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl overflow-hidden">
            {[
              { icon: Film, label: 'Cinema' },
              { icon: Compass, label: 'Explore Places' },
              { icon: Bookmark, label: 'Watchlist' },
              { icon: Clapperboard, label: 'Restaurant Log' },
              { icon: MessageCircle, label: 'Ask Anything' },
              { icon: Eye, label: 'Watched' },
              { icon: Settings, label: 'Settings' },
              { icon: Smartphone, label: 'Install on iPhone' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setMoreMenuOpen(false);
                  if (item.label === 'Settings') setShowSettings(true);
                }}
                className="w-full flex items-center gap-3 py-3.5 px-4 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <div className="mx-4 mb-6">
          <button className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Settings Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowSettings(false)}>
          <div
            className="w-full max-w-xl max-h-[85vh] bg-white dark:bg-[#18181b] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-[#18181b] border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between z-10">
              <button onClick={() => setShowSettings(false)} className="text-purple-600 dark:text-purple-400 font-medium text-sm">
                ✕ Cancel
              </button>
              <h2 className="font-bold text-gray-900 dark:text-white">Settings</h2>
              <button className="text-purple-600 dark:text-purple-400 font-medium text-sm">Save</button>
            </div>

            <div className="p-5 space-y-6 pb-10">
              {/* Account */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Account</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Profile</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Change PIN</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Notifications</span>
                    <div className="w-10 h-6 bg-purple-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
                    <div className="w-10 h-6 bg-purple-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Language</span>
                    <span className="text-sm text-purple-600 dark:text-purple-400">English</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Location</span>
                    <span className="text-sm text-purple-600 dark:text-purple-400">San Francisco, CA</span>
                  </div>
                </div>
              </div>

              {/* Streaming Services */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Streaming Services</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['Netflix', 'Prime Video', 'Disney+', 'Apple TV+', 'Max', 'Hulu', 'Peacock', 'Starz', 'Tubi'].map((svc) => (
                    <span key={svc} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                      {svc}
                      <span className="ml-1 cursor-pointer">×</span>
                    </span>
                  ))}
                </div>
                <button className="text-xs text-purple-600 dark:text-purple-400 font-medium">+ Add service</button>
              </div>

              {/* About */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">About</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Version</span>
                    <span className="text-sm text-gray-400">0.1.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Privacy Policy</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Terms of Service</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <button className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-500 font-medium text-sm rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-30">
        <div className="max-w-xl mx-auto flex items-center justify-around py-1.5 px-2">
          {[
            { id: 'picks', label: 'Picks', icon: Clapperboard },
            { id: 'cinema', label: 'Cinema', icon: Film },
            { id: 'explore', label: 'Explore', icon: Compass },
            { id: 'ask', label: 'Ask', icon: MessageCircle },
            { id: 'more', label: 'More', icon: MoreHorizontal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMoreMenuOpen(false);
                }}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-purple-600 dark:text-purple-400' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// --- Title Card Component ---
function TitleCard({
  title,
  onLike,
  onSeen,
  onWatchlist,
}: {
  title: Title;
  onLike: () => void;
  onSeen: () => void;
  onWatchlist: () => void;
}) {
  return (
    <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Top: Poster + Info */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* Poster */}
          <div className="flex-shrink-0 w-20 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
            {title.posterUrl ? (
              <Image
                src={title.posterUrl}
                alt={title.title}
                width={80}
                height={112}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Platform badge + year + duration */}
            <div className="flex items-center gap-2 flex-wrap">
              {title.platforms.map((p) => (
                <span
                  key={p.id}
                  className="text-[10px] font-bold tracking-wide"
                  style={{ color: p.color }}
                >
                  {p.name}
                </span>
              ))}
              <span className="text-[10px] text-gray-400">•</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{title.year}</span>
              <span className="text-[10px] text-gray-400">•</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{title.durationOrEpisodes}</span>
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5 flex items-center gap-1">
              {title.title}
              <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-semibold text-gray-900 dark:text-white">{title.rating}</span>
              <span className="text-[10px] text-gray-400">({title.ratingCount} ratings)</span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1 mt-1">
              {title.genres.map((g) => (
                <span
                  key={g}
                  className="text-[10px] font-medium text-purple-600 dark:text-purple-400"
                >
                  {g}
                  {g !== title.genres[title.genres.length - 1] && ','}
                </span>
              ))}
            </div>

            {/* Language badge */}
            {title.subtitle && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[10px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full">
                <span className="text-xs">🌐</span>
                {title.subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-3">
          {title.description}
        </p>

        {/* Action buttons row */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onLike}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              title.liked
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 transition-all">
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onWatchlist}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              title.watchlisted
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Watchlist</span>
          </button>
          <button
            onClick={onSeen}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              title.seen
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Seen it</span>
          </button>
        </div>

        {/* Links row */}
        <div className="flex items-center gap-3 mt-3 text-xs text-purple-600 dark:text-purple-400">
          <button className="flex items-center gap-1 hover:underline">
            Where to watch <ExternalLink className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-1 hover:underline">
            Letterbox <ExternalLink className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-1 hover:underline">
            Details <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 dark:bg-gray-800 my-3" />

        {/* Family Takes */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Family Takes</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add your take..."
              className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-purple-500 dark:text-white placeholder:text-gray-400"
            />
            <button className="px-4 py-2 bg-[#7c3aed] text-white text-sm font-medium rounded-xl hover:bg-[#6d28d9] transition-colors">
              Post
            </button>
          </div>
          <label className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-gray-500 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded text-purple-600" />
            Share with family (uncheck to keep private)
          </label>
        </div>
        </div>
    </div>
  );
}

// --- Cinema Tab ---
function CinemaTab() {
  const [activeCinemaTab, setActiveCinemaTab] = useState<'theaters' | 'coming'>('theaters');

  // Mock theater data
  const theaters = [
    { id: 1, name: 'AMC Metreon 16', distance: '0.8 mi', address: '135 4th St, San Francisco', showing: 'Predator: Badlands', time: '7:30 PM' },
    { id: 2, name: 'Castro Theatre', distance: '1.2 mi', address: '429 Castro St, San Francisco', showing: 'The Seed of the Sacred Fig', time: '8:00 PM' },
    { id: 3, name: 'Silicon Valley Cinema', distance: '18 mi', address: '1555 N Capitol Ave, San Jose', showing: 'F1', time: '7:00 PM' },
  ];

  // Mock coming soon data
  const comingSoon = [
    { id: 101, title: 'Avatar: Fire and Ash', year: 2025, rating: 0, poster: '', genres: ['Action', 'Science Fiction'] },
    { id: 102, title: 'Mission: Impossible 8', year: 2025, rating: 0, poster: '', genres: ['Action', 'Thriller'] },
    { id: 103, title: 'Zootopia 2', year: 2025, rating: 0, poster: '', genres: ['Animation', 'Comedy'] },
  ];

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setActiveCinemaTab('theaters')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeCinemaTab === 'theaters'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'bg-white dark:bg-[#18181b] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
          }`}
        >
          Nearby Theaters
        </button>
        <button
          onClick={() => setActiveCinemaTab('coming')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeCinemaTab === 'coming'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'bg-white dark:bg-[#18181b] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
          }`}
        >
          Coming Soon
        </button>
      </div>

      {activeCinemaTab === 'theaters' && (
        <div className="space-y-3">
          {theaters.map((theater) => (
            <div
              key={theater.id}
              className="bg-white dark:bg-[#18181b] rounded-2xl p-4 border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Film className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{theater.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{theater.address}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">{theater.distance}</span>
                    <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-[10px] text-gray-400">{theater.showing}</span>
                    <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-[10px] text-gray-400">{theater.time}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeCinemaTab === 'coming' && (
        <div className="space-y-3">
          {comingSoon.map((movie) => (
            <div
              key={movie.id}
              className="bg-white dark:bg-[#18181b] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex items-center gap-3"
            >
              <div className="w-12 h-16 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0">
                <Film className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{movie.title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400">{movie.year}</span>
                  <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                  {movie.genres.map((g, i) => (
                    <span key={g} className="text-[10px] text-purple-600 dark:text-purple-400">
                      {g}{i < movie.genres.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              </div>
              <Clock className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Explore Tab (Google Maps placeholder) ---
function ExploreTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'cafes', label: 'Cafes' },
    { id: 'parks', label: 'Parks' },
    { id: 'events', label: 'Events' },
    { id: 'shopping', label: 'Shopping' },
  ];

  // Mock places data
  const places = [
    { id: 1, name: 'Golden Gate Park', category: 'parks', rating: 4.8, reviews: '12.4k', address: 'San Francisco, CA', distance: '2.1 mi' },
    { id: 2, name: 'Tony\'s Pizza', category: 'restaurants', rating: 4.5, reviews: '3.2k', address: 'Embarcadero, SF', distance: '0.5 mi' },
    { id: 3, name: 'Blue Bottle Coffee', category: 'cafes', rating: 4.6, reviews: '1.8k', address: 'Pier 28, SF', distance: '0.9 mi' },
    { id: 4, name: 'Westfield Mall', category: 'shopping', rating: 4.3, reviews: '8.7k', address: 'San Francisco, CA', distance: '3.2 mi' },
    { id: 5, name: 'Ferry Building Market', category: 'events', rating: 4.7, reviews: '5.1k', address: '1 Ferry Building, SF', distance: '0.7 mi' },
  ];

  const filtered = activeFilter === 'all' ? places : places.filter((p) => p.category === activeFilter);

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search places near you..."
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-purple-500 dark:text-white placeholder:text-gray-400"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeFilter === filter.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'bg-white dark:bg-[#18181b] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Map placeholder */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl h-48 mb-5 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700">
        <Compass className="w-10 h-10 text-blue-400 dark:text-blue-300 mb-2" />
        <p className="text-sm text-blue-500 dark:text-blue-300 font-medium">Google Maps Integration</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Interactive map will appear here</p>
      </div>

      {/* Results list */}
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Nearby Places</h3>
      <div className="space-y-3">
        {filtered.map((place) => (
          <div
            key={place.id}
            className="bg-white dark:bg-[#18181b] rounded-2xl p-4 border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{place.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-medium text-gray-900 dark:text-white">{place.rating}</span>
                  <span className="text-[10px] text-gray-400">({place.reviews})</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{place.address}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">{place.distance}</span>
                  <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-[10px] text-gray-400 capitalize">{place.category}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Ask Tab (AI Chat) ---
function AskTab() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hi! I'm your MovieChoice assistant. Ask me anything about movies, shows, restaurants, or recommendations." },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestions = [
    "What should I watch tonight?",
    "Recommend a good restaurant nearby",
    "What's trending this week?",
    "Find me a comedy to relax",
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: input }]);
    setInput('');
    setIsTyping(true);

    // Simulated AI response
    setTimeout(() => {
      const responses = [
        "Based on your taste signals, I'd recommend checking out Predator: Badlands. It's available on Hulu and matches your preference for action-scifi blends.",
        "Great question! There are 5 highly-rated restaurants within 2 miles. Would you like me to show them on the map?",
        "This week's trending titles include Avatar: Fire and Ash and The WONDERfools. Both have strong audience scores.",
        "For a relaxing comedy, I'd suggest The WONDERfools — it has a 8.9 rating with fans calling it 'hilarious and heartwarming.'",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages((prev) => [...prev, { role: 'ai', text: randomResponse }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-20rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-[#18181b] border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#18181b] border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => { setInput(s); }}
              className="px-3 py-1.5 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Ask anything..."
          className="flex-1 px-4 py-3 bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-purple-500 dark:text-white placeholder:text-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
