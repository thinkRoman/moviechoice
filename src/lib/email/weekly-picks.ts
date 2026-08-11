/**
 * Modern 2026 HTML email template for weekly MovieChoice picks.
 * Uses contemporary design: bento grids, glassmorphism, gradient accents,
 * modern typography (Inter/system), and generous whitespace.
 */

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] ?? character);
}

export interface WeeklyPick {
  title: string;
  year: number;
  rating: number;
  overview: string;
  posterUrl: string;
  streamingService?: string;
  mediaType: 'movie' | 'show';
  tmdbId: number;
}

export interface WeeklyPicksEmailInput {
  userName: string;
  picks: WeeklyPick[];
  appUrl: string;
  weekLabel: string;
}

function renderPickCard(pick: WeeklyPick, index: number, appUrl: string): string {
  const escaped = {
    title: escapeHtml(pick.title),
    overview: escapeHtml(pick.overview.slice(0, 120)),
    service: pick.streamingService ? escapeHtml(pick.streamingService) : '',
    type: pick.mediaType === 'show' ? 'Series' : 'Film',
  };

  const stars = '★'.repeat(Math.round(pick.rating / 2)) + '☆'.repeat(5 - Math.round(pick.rating / 2));
  const link = `${appUrl}/${pick.mediaType === 'show' ? 'shows' : 'movies'}/${pick.tmdbId}`;

  return `
    <a href="${link}" target="_blank" style="text-decoration:none;color:inherit;display:block">
      <div style="background:rgba(255,255,255,0.06);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;transition:transform 0.2s">
        <div style="position:relative;padding-top:120%;background:#1a1525">
          <img src="${escapeHtml(pick.posterUrl)}" alt="${escaped.title}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover" />
          <div style="position:absolute;top:12px;left:12px;background:rgba(124,58,237,0.9);backdrop-filter:blur(8px);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;color:white;letter-spacing:0.5px">${escaped.type}</div>
          <div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);padding:4px 10px;border-radius:12px;font-size:12px;font-weight:700;color:#facc15">★ ${(pick.rating / 2).toFixed(1)}</div>
        </div>
        <div style="padding:16px 18px 20px">
          <h3 style="margin:0 0 4px;font-size:17px;font-weight:800;color:white;letter-spacing:-0.3px;line-height:1.2">${escaped.title}</h3>
          <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.45);font-weight:600;letter-spacing:0.5px">${pick.year} · ${escaped.service || 'Streaming'}</p>
          <p style="margin:0;font-size:13px;line-height:1.5;color:rgba(255,255,255,0.6)">${escaped.overview}${pick.overview.length > 120 ? '…' : ''}</p>
        </div>
      </div>
    </a>`;
}

export function renderWeeklyPicksEmail(input: WeeklyPicksEmailInput): { html: string; text: string } {
  const { userName, picks, appUrl, weekLabel } = input;
  const escapedName = escapeHtml(userName);
  const escapedWeek = escapeHtml(weekLabel);

  // Plain text version
  const text = [
    `Hi ${userName},`,
    '',
    `Here are your MovieChoice picks for the week of ${weekLabel}:`,
    '',
    ...picks.map((p, i) => `${i + 1}. ${p.title} (${p.year}) — ★${(p.rating / 2).toFixed(1)} — ${p.mediaType === 'show' ? 'Series' : 'Film'}`),
    '',
    `Open MovieChoice to see all picks: ${appUrl}`,
    '',
    '— The MovieChoice Team',
  ].join('\n');

  // HTML version — modern 2026 design
  const pickCards = picks.map((pick, i) => renderPickCard(pick, i, appUrl)).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>Your MovieChoice picks this week</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background:#0a0813;font-family:'Inter',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden">Your weekly MovieChoice picks are here 🎬</div>

  <!-- Hero Section -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#12091e 0%,#0a0813 100%)">
    <tr>
      <td align="center" style="padding:48px 20px 32px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px">
          <tr>
            <td align="center">
              <!-- Logo -->
              <div style="margin-bottom:32px">
                <span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:white">MOVIE<span style="color:#a78bfa">CHOICE</span></span>
              </div>

              <!-- Week badge -->
              <div style="display:inline-block;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);border-radius:999px;padding:6px 18px;margin-bottom:24px">
                <span style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#a78bfa">Week of ${escapedWeek}</span>
              </div>

              <!-- Headline -->
              <h1 style="margin:0 0 12px;font-size:36px;font-weight:900;color:white;letter-spacing:-1px;line-height:1.1">
                Your picks<br/>are ready
              </h1>
              <p style="margin:0 0 8px;font-size:16px;color:rgba(255,255,255,0.5);font-weight:500;line-height:1.5">
                Hi ${escapedName}, here's what we picked for you this week.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Picks Grid -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0813">
    <tr>
      <td align="center" style="padding:0 20px 40px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px">
          <tr>
            <td>
              ${pickCards}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- CTA Section -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0813">
    <tr>
      <td align="center" style="padding:0 20px 48px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px">
          <tr>
            <td align="center" style="padding:32px;background:linear-gradient(135deg,rgba(124,58,237,0.12),rgba(168,85,247,0.08));border:1px solid rgba(124,58,237,0.2);border-radius:24px">
              <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.6);font-weight:500">
                Want more? Open MovieChoice to see your full personalized feed.
              </p>
              <a href="${appUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:white;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:-0.2px;box-shadow:0 8px 32px rgba(124,58,237,0.4)">
                Open MovieChoice →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0813;border-top:1px solid rgba(255,255,255,0.06)">
    <tr>
      <td align="center" style="padding:32px 20px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px">
          <tr>
            <td align="center">
              <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.3);font-weight:500">
                Sent with ♥ by MovieChoice
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2)">
                You're receiving this because you're a MovieChoice member.
                <a href="${appUrl}/settings" style="color:rgba(167,139,250,0.6);text-decoration:underline">Update preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}
