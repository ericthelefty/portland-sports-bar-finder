import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'pdx_admin';
const MAX_AGE = 60 * 60 * 24 * 14; // two weeks

function secret() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 8) return null;
  return pw;
}

function sign(value) {
  return createHmac('sha256', secret()).update(value).digest('hex');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export function adminConfigured() {
  return secret() !== null;
}

export function passwordMatches(input) {
  const pw = secret();
  return pw !== null && safeEqual(input ?? '', pw);
}

// The session cookie holds an expiry time plus a signature made with the admin password,
// so changing the password signs everyone out.
export async function startSession() {
  const expires = Date.now() + MAX_AGE * 1000;
  const value = `${expires}.${sign(`admin:${expires}`)}`;
  const jar = await cookies();
  jar.set(COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && !process.env.ALLOW_INSECURE_COOKIE,
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAdmin() {
  if (!secret()) return false;
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return false;
  const [expires, sig] = raw.split('.');
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  return safeEqual(sig, sign(`admin:${expires}`));
}
