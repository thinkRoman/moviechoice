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

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: 'Your MovieChoice access PIN',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#18181b">
          <h1 style="color:#7c3aed">MovieChoice</h1>
          <p>Hi ${name},</p>
          <p>You have been invited to MovieChoice using <strong>${email}</strong>.</p>
          <p style="font-size:30px;letter-spacing:8px;font-weight:700">${pin}</p>
          <p><a href="${url}" style="display:inline-block;background:#7c3aed;color:white;padding:12px 18px;border-radius:10px;text-decoration:none">Sign in to MovieChoice</a></p>
          <p style="color:#71717a;font-size:13px">Your owner can regenerate this PIN at any time.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the invitation email (${response.status})`);
  }
}
