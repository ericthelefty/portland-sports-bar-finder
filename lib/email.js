import 'server-only';

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function siteUrl() {
  const fromEnv = process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  return (fromEnv || 'http://localhost:3000').replace(/\/$/, '');
}

// Sends the "confirm your email" message through Resend. Returns true when it was accepted.
export async function sendConfirmationEmail({ to, token, barName }) {
  if (!emailConfigured()) return false;
  const link = `${siteUrl()}/confirm?token=${encodeURIComponent(token)}`;
  const subject = 'Confirm your TV package report';
  const text = [
    `Thanks for reporting TV packages${barName ? ` at ${barName}` : ''}.`,
    '',
    'Confirm your email address so we can review your report:',
    link,
    '',
    "If you didn't send this report, ignore this email and nothing will happen.",
  ].join('\n');
  const html = `
    <p>Thanks for reporting TV packages${barName ? ` at <strong>${escapeHtml(barName)}</strong>` : ''}.</p>
    <p><a href="${link}">Confirm your email address</a> so we can review your report.</p>
    <p style="color:#666">If you didn't send this report, ignore this email and nothing will happen.</p>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text, html }),
    });
    if (!res.ok) {
      console.error('Resend error', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Resend request failed', err);
    return false;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
