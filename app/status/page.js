import { sql, ensureDb } from '@/lib/db';
import { adminConfigured } from '@/lib/auth';
import { emailConfigured } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Setup check', robots: { index: false, follow: false } };

// Checks the connection string's shape without ever showing the password.
function inspectUrl(raw) {
  const problems = [];
  if (!raw) return { problems: ['DATABASE_URL is not set. Add it in Vercel under Settings → Environment Variables, then redeploy.'] };
  const value = raw.trim();
  if (value !== raw) problems.push('DATABASE_URL has spaces or a line break at the start or end. Delete and re-paste it.');
  if (/^["']|["']$/.test(value)) problems.push('DATABASE_URL is wrapped in quote marks. Remove the quotes.');
  if (/\[|\]/.test(value)) problems.push('DATABASE_URL still contains square brackets. Replace [YOUR-PASSWORD], brackets included, with your database password.');
  if (!/^postgres(ql)?:\/\//.test(value.replace(/^["']/, ''))) problems.push('DATABASE_URL should start with postgresql://');
  let url;
  try {
    url = new URL(value.replace(/^["']|["']$/g, ''));
  } catch {
    problems.push("DATABASE_URL can't be read as a connection string. A symbol in the password (like @ # / ?) is the usual cause. Reset the database password in Supabase to one with only letters and numbers.");
    return { problems };
  }
  const host = url.hostname;
  if (/^db\./.test(host) || url.port === '5432')
    problems.push('This is the direct connection string. In Supabase, click Connect and copy the "Transaction pooler" string instead (it uses port 6543).');
  if (host && !/pooler\.supabase\.com$/.test(host) && !/^(localhost|127\.0\.0\.1)$/.test(host))
    problems.push(`The host (${host}) isn't a Supabase pooler address. Use the "Transaction pooler" string from Supabase's Connect panel.`);
  if (/pooler\.supabase\.com$/.test(host) && !/^postgres\.[a-z0-9]+$/i.test(decodeURIComponent(url.username)))
    problems.push('The user name should look like postgres.abcdefghij (with your project ID). Copy the whole string from the Connect panel again.');
  if (!url.password) problems.push('The connection string has no password in it.');
  if (/[@#/?]/.test(decodeURIComponent(url.password || '')))
    problems.push('The password contains a symbol that can break the connection. Reset it in Supabase to letters and numbers only.');
  return {
    problems,
    summary: `host ${host || '?'}, port ${url.port || 'default'}, user ${decodeURIComponent(url.username || '?')}, password ${url.password ? 'present (hidden)' : 'missing'}`,
  };
}

function explainDbError(err) {
  const msg = String(err?.message || err);
  const code = err?.code || '';
  if (/password authentication failed/i.test(msg)) return 'Supabase rejected the password. Check it, or reset the database password in Supabase and update DATABASE_URL.';
  if (/tenant or user not found/i.test(msg)) return "Supabase doesn't recognize the user name. Copy the Transaction pooler string again so it includes postgres.<your project ID>.";
  if (code === 'ENOTFOUND' || /getaddrinfo/i.test(msg)) return "The database address can't be found. Copy the Transaction pooler string again.";
  if (code === 'ECONNREFUSED' || /timeout|ETIMEDOUT/i.test(msg)) return 'The database did not answer. If your Supabase project is paused, resume it from the Supabase dashboard.';
  return 'The database returned an error.';
}

function Row({ ok, label, children }) {
  return (
    <tr>
      <td>
        <span className={`st ${ok ? 'has' : 'not'}`}>{ok ? 'OK' : 'Fix'}</span>
      </td>
      <td>
        <strong>{label}</strong>
        <div className="small">{children}</div>
      </td>
    </tr>
  );
}

export default async function StatusPage() {
  const url = inspectUrl(process.env.DATABASE_URL);
  let db = { ok: false, detail: 'Skipped until DATABASE_URL looks right.' };
  if (url.problems.length === 0) {
    try {
      await ensureDb();
      const [{ n }] = await sql`select count(*)::int as n from bars`;
      db = { ok: true, detail: `Connected. ${n} bars in the database.` };
    } catch (err) {
      console.error('Setup check: database error', err);
      db = { ok: false, detail: `${explainDbError(err)} Details: ${String(err?.message || err).slice(0, 200)}` };
    }
  }
  const admin = adminConfigured();
  const email = emailConfigured();

  return (
    <div className="prose">
      <h1 className="page-title">Setup check</h1>
      <p className="lede">Shows whether the site's settings are working. Passwords are never displayed.</p>
      <div className="table-scroll" style={{ marginTop: 16 }}>
        <table className="cmp" id="status-table">
          <tbody>
            <Row ok={url.problems.length === 0} label="Database connection string (DATABASE_URL)">
              {url.problems.length ? (
                <ul>
                  {url.problems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              ) : (
                <>Looks right: {url.summary}</>
              )}
            </Row>
            <Row ok={db.ok} label="Database">
              <span id="db-status">{db.detail}</span>
            </Row>
            <Row ok={admin} label="Admin password (ADMIN_PASSWORD)">
              {admin ? 'Set.' : 'Missing or shorter than 8 characters. Add it in Vercel, then redeploy.'}
            </Row>
            <Row ok={email} label="Confirmation emails (optional)">
              {email ? 'Resend is set up.' : 'Off. Reports still work; see SETUP.md to turn them on.'}
            </Row>
          </tbody>
        </table>
      </div>
      <p className="small" style={{ marginTop: 16 }}>
        After changing a setting in Vercel, redeploy (Deployments → ⋯ → Redeploy), then reload this page.
      </p>
    </div>
  );
}
