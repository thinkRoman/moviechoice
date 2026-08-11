import { NextResponse } from 'next/server';
import { sendWeeklyPicks } from '@/lib/weekly-push';

/**
 * Vercel Cron: /api/cron/weekly-picks
 * Runs every Friday at 9 AM UTC.
 * Sends personalized weekly recommendation picks via email and/or WhatsApp.
 *
 * Protected by CRON_SECRET env var (Vercel cron auth header).
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await sendWeeklyPicks();

    const summary = {
      total: results.length,
      emailsSent: results.filter((r) => r.emailSent).length,
      whatsappSent: results.filter((r) => r.whatsappSent).length,
      errors: results.filter((r) => r.error).map((r) => ({ email: r.email, error: r.error })),
    };

    console.log('[weekly-picks] Cron completed:', summary);

    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error('[weekly-picks] Cron failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Weekly push failed' },
      { status: 500 },
    );
  }
}
