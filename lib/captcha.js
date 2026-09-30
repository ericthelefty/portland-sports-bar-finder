import 'server-only';

// Cloudflare Turnstile is on only when both keys are set in Vercel.
export function captchaSiteKey() {
  return process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY ? process.env.TURNSTILE_SITE_KEY : null;
}

export function captchaEnabled() {
  return captchaSiteKey() !== null;
}

// Asks Cloudflare whether the token from the form is a real, unused pass.
export async function verifyCaptcha(token, ip) {
  if (!captchaEnabled()) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token });
    if (ip && ip !== 'unknown') body.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = await res.json();
    if (!data.success) console.warn('Turnstile rejected a report', data['error-codes']);
    return data.success === true;
  } catch (err) {
    console.error('Turnstile check failed', err);
    return false;
  }
}
