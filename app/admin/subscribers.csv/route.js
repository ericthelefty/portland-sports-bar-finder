import { isAdmin } from '@/lib/auth';
import { getSubscribers } from '@/lib/data';

export const dynamic = 'force-dynamic';

const cell = (v) => {
  const s = v instanceof Date ? v.toISOString() : String(v ?? '');
  // Quote every cell and neutralize spreadsheet formulas.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET() {
  if (!(await isAdmin())) return new Response('Sign in at /admin first.', { status: 401 });
  const rows = await getSubscribers();
  const lines = [
    ['email', 'confirmed', 'signed_up_at', 'source', 'consent_text'].map(cell).join(','),
    ...rows.map((r) => [r.email, r.verified ? 'yes' : 'no', r.consented_at, r.source, r.consent_text].map(cell).join(',')),
  ];
  return new Response(lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="email-list.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
