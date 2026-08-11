/**
 * Weekly recommendation push engine for MovieChoice.
 * Runs as a Vercel cron job every Friday morning.
 * Sends personalized picks via email (Resend) and/or WhatsApp (Meta API).
 */

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import { sendWhatsAppTemplate, formatWhatsAppNumber } from '@/lib/whatsapp';
import { renderWeeklyPicksEmail, type WeeklyPick } from '@/lib/email/weekly-picks';
import { resolveAppLoginUrl } from '@/lib/resend';
import type { IUser } from '@/models/User';

const RESEND_API_URL = 'https://api.resend.com/emails';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

interface PushResult {
  userId: string;
  email: string;
  channel: 'email' | 'whatsapp' | 'both';
  emailSent: boolean;
  whatsappSent: boolean;
  error?: string;
}

/**
 * Fetch trending movies/shows from TMDB for a given user's preferences.
 * Uses the same TMDB token as the rest of the app.
 */
async function fetchWeeklyPicks(
  providerIds: number[],
  genreIds: number[],
  movieCount: number,
  showCount: number,
  yearsBack: number,
  includeInternational: boolean,
): Promise<WeeklyPick[]> {
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  if (!token) return [];

  const earliest = new Date();
  earliest.setFullYear(earliest.getFullYear() - yearsBack);
  const dateStr = earliest.toISOString().split('T')[0];

  const providers = providerIds.join('|');

  // Fetch movies
  const movieParams = new URLSearchParams({
    sort_by: 'popularity.desc',
    'vote_count.gte': '200',
    'vote_average.gte': '6.5',
    'primary_release_date.gte': dateStr,
    with_watch_monetization_types: 'flatrate|subscription',
    with_watch_providers: providers,
    ...(genreIds.length ? { with_genres: genreIds.join('|') } : {}),
  });

  // Fetch TV shows
  const showParams = new URLSearchParams({
    sort_by: 'popularity.desc',
    'vote_count.gte': '100',
    'vote_average.gte': '6.5',
    'first_air_date.gte': dateStr,
    with_watch_monetiation_types: 'flatrate|subscription',
    with_watch_providers: providers,
    ...(genreIds.length ? { with_genres: genreIds.join('|') } : {}),
  });

  const [movieRes, showRes] = await Promise.all([
    fetch(`${TMDB_BASE}/discover/movie?${movieParams}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${TMDB_BASE}/discover/tv?${showParams}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  const movieData = movieRes.ok ? await movieRes.json() as { results?: Array<{ id: number; title: string; release_date?: string; vote_average: number; overview: string; poster_path?: string; genre_ids: number[] }> } : { results: [] };
  const showData = showRes.ok ? await showRes.json() as { results?: Array<{ id: number; name: string; first_air_date?: string; vote_average: number; overview: string; poster_path?: string; genre_ids: number[] }> } : { results: [] };

  const movies: WeeklyPick[] = (movieData.results || []).slice(0, movieCount).map((m) => ({
    title: m.title,
    year: m.release_date ? parseInt(m.release_date.split('-')[0], 10) : 0,
    rating: m.vote_average,
    overview: m.overview,
    posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}/w500${m.poster_path}` : `${TMDB_IMAGE_BASE}/w500/null`,
    mediaType: 'movie' as const,
    tmdbId: m.id,
  }));

  const shows: WeeklyPick[] = (showData.results || []).slice(0, showCount).map((s) => ({
    title: s.name,
    year: s.first_air_date ? parseInt(s.first_air_date.split('-')[0], 10) : 0,
    rating: s.vote_average,
    overview: s.overview,
    posterUrl: s.poster_path ? `${TMDB_IMAGE_BASE}/w500${s.poster_path}` : `${TMDB_IMAGE_BASE}/w500/null`,
    mediaType: 'show' as const,
    tmdbId: s.id,
  }));

  return [...movies, ...shows];
}

/**
 * Send weekly picks email via Resend.
 */
async function sendWeeklyPicksEmail(
  email: string,
  userName: string,
  picks: WeeklyPick[],
  weekLabel: string,
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM;
  const appUrl = resolveAppLoginUrl();

  if (!apiKey || !from || !appUrl) {
    return { sent: false, error: 'Resend not configured' };
  }

  const { html, text } = renderWeeklyPicksEmail({
    userName,
    picks,
    appUrl,
    weekLabel,
  });

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `🎬 Your MovieChoice picks — ${weekLabel}`,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return { sent: false, error: `Resend error ${response.status}: ${detail.slice(0, 100)}` };
    }

    return { sent: true };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : 'Email send failed' };
  }
}

/**
 * Send weekly picks via WhatsApp template message.
 */
async function sendWeeklyPicksWhatsApp(
  phoneNumber: string,
  picks: WeeklyPick[],
  appUrl: string,
): Promise<{ sent: boolean; error?: string }> {
  if (!phoneNumber) {
    return { sent: false, error: 'No WhatsApp number' };
  }

  // Build picks text for template body parameter
  const picksText = picks
    .map((p, i) => `${i + 1}. *${p.title}* (${p.year}) — ★${(p.rating / 2).toFixed(1)}`)
    .join('\n');

  const result = await sendWhatsAppTemplate(
    phoneNumber,
    'weekly_picks',
    'en',
    [
      {
        type: 'body',
        index: '0',
        parameters: [
          { type: 'text', text: picksText },
          { type: 'text', text: appUrl },
        ],
      },
    ],
  );

  return { sent: result.success, error: result.error };
}

/**
 * Main function: send weekly picks to all eligible users.
 */
export async function sendWeeklyPicks(): Promise<PushResult[]> {
  await dbConnect();

  const appUrl = resolveAppLoginUrl() || '';
  const now = new Date();
  const weekLabel = `${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;

  // Get all active users with notification preferences
  const users = await User.find({
    status: 'ACTIVE',
    notifyVia: { $in: ['email', 'whatsapp', 'both'] },
  }).lean();

  const results: PushResult[] = [];

  for (const user of users) {
    const typedUser = user as unknown as IUser & { _id: { toString(): string } };
    const userId = typedUser._id.toString();
    const notifyVia = typedUser.notifyVia || 'email';

    // Get user's profile preferences
    const profile = await Profile.findOne({ userId })
      .select('preferences.recommendation')
      .lean();

    const rec = (profile as { preferences?: { recommendation?: { providerIds?: number[]; genreIds?: number[]; movieCount?: number; showCount?: number; yearsBack?: number; includeInternational?: boolean } } } | null)
      ?.preferences?.recommendation;

    // Skip if no providers configured
    if (!rec?.providerIds?.length) continue;

    // Generate picks
    const picks = await fetchWeeklyPicks(
      rec.providerIds,
      rec.genreIds || [],
      rec.movieCount || 3,
      rec.showCount || 2,
      rec.yearsBack || 2,
      rec.includeInternational ?? true,
    );

    if (!picks.length) continue;

    const result: PushResult = {
      userId,
      email: typedUser.email,
      channel: notifyVia,
      emailSent: false,
      whatsappSent: false,
    };

    // Send email
    if (notifyVia === 'email' || notifyVia === 'both') {
      const emailResult = await sendWeeklyPicksEmail(
        typedUser.email,
        typedUser.name || 'there',
        picks,
        weekLabel,
      );
      result.emailSent = emailResult.sent;
      if (emailResult.error) result.error = emailResult.error;
    }

    // Send WhatsApp
    if ((notifyVia === 'whatsapp' || notifyVia === 'both') && typedUser.whatsappNumber) {
      const fullNumber = formatWhatsAppNumber(typedUser.countryCode || '+1', typedUser.whatsappNumber);
      const waResult = await sendWeeklyPicksWhatsApp(fullNumber, picks, appUrl);
      result.whatsappSent = waResult.sent;
      if (waResult.error) result.error = result.error ? `${result.error}; WA: ${waResult.error}` : waResult.error;
    }

    results.push(result);
  }

  return results;
}
