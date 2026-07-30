function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] ?? character);
}

export async function sendAccessPinEmail(input: {
  name: string;
  email: string;
  pin: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM;
  const loginUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL;

  if (!apiKey || !from || !loginUrl) {
    throw new Error('Resend sender or application URL is not configured');
  }

  const email = escapeHtml(input.email);
  const name = escapeHtml(input.name);
  const pin = escapeHtml(input.pin);
  const url = escapeHtml(`${loginUrl.replace(/\/$/, '')}/signin`);
  const textUrl = `${loginUrl.replace(/\/$/, '')}/signin`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: `${input.name}, you’re invited to MovieChoice`,
      text: [
        `Hi ${input.name},`,
        '',
        'You’ve been invited to MovieChoice — a simpler way to decide what to watch.',
        '',
        `Sign in with: ${input.email}`,
        `Your access PIN: ${input.pin}`,
        '',
        `Open MovieChoice: ${textUrl}`,
        '',
        'Keep this PIN private. If you did not expect this invitation, you can ignore this email.',
      ].join('\n'),
      html: `
        <!doctype html>
        <html lang="en">
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="color-scheme" content="light">
            <title>You’re invited to MovieChoice</title>
          </head>
          <body style="margin:0;background:#f5f3f7;color:#241d2b;font-family:Arial,Helvetica,sans-serif">
            <div style="display:none;max-height:0;overflow:hidden">Your personal MovieChoice access PIN is inside.</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f3f7">
              <tr>
                <td align="center" style="padding:40px 16px">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e2ed;border-radius:24px;overflow:hidden">
                    <tr>
                      <td style="background:#18121f;padding:28px 32px">
                        <div style="font-size:20px;font-weight:800;letter-spacing:-0.5px;color:#ffffff">MOVIE<span style="color:#a78bfa">CHOICE</span></div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:36px 32px 12px">
                        <p style="margin:0 0 10px;color:#7c3aed;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">You’re invited</p>
                        <h1 style="margin:0;font-family:Georgia,serif;font-size:34px;line-height:1.15;color:#241d2b">Less scrolling.<br>More watching.</h1>
                        <p style="margin:22px 0 0;font-size:16px;line-height:1.65;color:#62586b">Hi ${name}, you’ve been invited to MovieChoice—a simpler way to get a thoughtful shortlist based on what you actually like.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 32px">
                        <div style="border:1px solid #e8e2ed;border-radius:18px;background:#faf8fc;padding:22px;text-align:center">
                          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#74687d">Your 6-digit access PIN</p>
                          <p style="margin:0;font-size:34px;font-weight:800;letter-spacing:9px;color:#6d28d9">${pin}</p>
                          <p style="margin:14px 0 0;font-size:13px;color:#74687d">Sign in as ${email}</p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding:4px 32px 36px">
                        <a href="${url}" style="display:inline-block;background:#6d28d9;color:#ffffff;padding:15px 28px;border-radius:999px;text-decoration:none;font-size:15px;font-weight:700">Open MovieChoice</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="border-top:1px solid #eee9f1;padding:22px 32px">
                        <p style="margin:0;font-size:12px;line-height:1.6;color:#8a8090">Keep this PIN private. The MovieChoice owner can replace it at any time. If you weren’t expecting this invitation, you can safely ignore this email.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the invitation email (${response.status})`);
  }
}
