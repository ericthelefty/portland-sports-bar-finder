import { NextResponse } from 'next/server';
import { sql, ensureDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// The link in the confirmation email lands here.
export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  let ok = false;
  if (token.length >= 20) {
    await ensureDb();
    const rows = await sql`
      update reports set email_verified = true, verify_token = null
      where verify_token = ${token}
      returning email`;
    if (rows.length) {
      ok = true;
      await sql`update subscribers set verified = true where email = ${rows[0].email}`;
    }
  }
  return NextResponse.redirect(new URL(ok ? '/confirmed' : '/confirmed?invalid=1', url.origin), 303);
}
