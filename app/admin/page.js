import Link from 'next/link';
import { isAdmin, adminConfigured } from '@/lib/auth';
import { getPendingReports, getRecentReviewed, getCounts } from '@/lib/data';
import { emailConfigured } from '@/lib/email';
import { approveReport, rejectReport, adminLogout } from '@/app/actions';
import { packageLabel, relationLabel, AREAS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import LoginForm from './LoginForm';
import AdminNav from './AdminNav';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Review reports', robots: { index: false, follow: false } };

function currentStatus(report, key) {
  const row = report.current.find((p) => p.package === key);
  if (!row) return 'Unknown';
  return row.status === 'has' ? `Has it (${row.source === 'bar_website' ? "bar's site" : row.source})` : 'Not available';
}

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <div className="prose">
        <h1 className="page-title">Review reports</h1>
        <p className="form-error" style={{ marginTop: 16 }}>
          The review page is locked because no admin password is set. In Vercel, add an environment variable named
          ADMIN_PASSWORD (at least 8 characters), then redeploy.
        </p>
      </div>
    );
  }
  if (!(await isAdmin())) {
    return (
      <>
        <h1 className="page-title">Review reports</h1>
        <p className="lede">Enter the admin password to review reports.</p>
        <LoginForm />
      </>
    );
  }

  const [pending, recent, counts] = await Promise.all([getPendingReports(), getRecentReviewed(), getCounts()]);
  const sendsEmail = emailConfigured();

  return (
    <>
      <h1 className="page-title">Review reports</h1>
      <AdminNav current="reports" />
      <div className="admin-bar">
        <div className="stats">
          <div>
            <b id="pending-count">{counts.pending}</b>waiting for review
          </div>
          <div>
            <b>{counts.subscribers}</b>email-list signups ({counts.verified_subscribers} confirmed)
          </div>
        </div>
        <div className="actions">
          <a className="btn" href="/admin/subscribers.csv">
            Download email list (CSV)
          </a>
          <form action={adminLogout}>
            <button className="btn" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
      {!sendsEmail && (
        <p className="note">
          Confirmation emails are off because Resend isn't set up yet, so reports arrive with unconfirmed emails. See the
          setup guide to turn them on.
        </p>
      )}

      {pending.length === 0 && <p className="empty">No reports are waiting. New ones will show up here.</p>}

      {pending.map((r) => {
        const keys = [...new Set([...r.has, ...r.not])];
        return (
          <section className="report-card" key={r.id} id={`report-${r.id}`} aria-labelledby={`rh-${r.id}`}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 id={`rh-${r.id}`}>
                {r.barId ? (
                  <Link href={`/bars/${r.barId}`} target="_blank">
                    {r.barName}
                  </Link>
                ) : (
                  <>New bar: {r.newBarName}</>
                )}
              </h3>
              <div className="row">
                {!r.barId && <span className="flag plain">New bar</span>}
                {r.not.map((k) => (
                  <span className="flag" key={k}>
                    Disputes {packageLabel(k)}
                  </span>
                ))}
                <span className={`flag ${r.emailVerified ? 'ok' : 'plain'}`}>
                  {r.emailVerified ? 'Email confirmed' : 'Email not confirmed'}
                </span>
              </div>
            </div>
            {!r.barId && (
              <p className="small">
                {r.newBarAddress}
                {r.newBarArea ? ` · ${r.newBarArea}` : ''}
              </p>
            )}
            {keys.length > 0 && (
              <div className="table-scroll">
                <table className="cmp">
                  <thead>
                    <tr>
                      <th scope="col">Package</th>
                      <th scope="col">Listed now</th>
                      <th scope="col">This report says</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k) => (
                      <tr key={k}>
                        <td>{packageLabel(k)}</td>
                        <td>{r.barId ? currentStatus(r, k) : '—'}</td>
                        <td>
                          <strong>{r.has.includes(k) ? 'Has it' : "Doesn't have it"}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="small">
              {relationLabel(r.relation)}
              {r.seenOn ? ` · seen ${formatDate(r.seenOn)}` : ''} · sent {formatDate(r.createdAt)} · {r.email}
              {r.optIn ? ' · joined email list' : ''}
            </div>
            {r.otherPackage && (
              <div className="small">
                Other package mentioned: <strong>{r.otherPackage}</strong> (not added automatically)
              </div>
            )}
            {r.link && (
              <div className="small">
                Link:{' '}
                <a href={r.link} target="_blank" rel="noopener noreferrer nofollow">
                  {r.link}
                </a>
              </div>
            )}
            {r.note && <blockquote className="quote">{r.note}</blockquote>}
            <div className="actions">
              <form action={approveReport} className="actions">
                <input type="hidden" name="id" value={r.id} />
                {!r.barId && (
                  <select name="newBarArea" defaultValue={r.newBarArea} aria-label="Area for the new bar" style={{ width: 'auto' }}>
                    <option value="">Area unknown</option>
                    {AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                )}
                <button className="btn primary" type="submit" id={`approve-${r.id}`}>
                  {r.barId ? 'Approve and update listing' : 'Approve and add bar'}
                </button>
              </form>
              <form action={rejectReport}>
                <input type="hidden" name="id" value={r.id} />
                <button className="btn danger" type="submit" id={`reject-${r.id}`}>
                  Reject
                </button>
              </form>
            </div>
          </section>
        );
      })}

      {recent.length > 0 && (
        <>
          <h2 className="section-title">Recently reviewed</h2>
          <div className="table-scroll">
            <table className="cmp">
              <thead>
                <tr>
                  <th scope="col">Bar</th>
                  <th scope="col">Report</th>
                  <th scope="col">Decision</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td>{r.barName || r.newBarName}</td>
                    <td>
                      {[...r.has.map((k) => `+ ${packageLabel(k)}`), ...r.not.map((k) => `− ${packageLabel(k)}`)].join(', ') ||
                        'New bar'}
                    </td>
                    <td>
                      {r.status === 'approved' ? 'Approved' : 'Rejected'}
                      {r.reviewedAt ? ` · ${formatDate(r.reviewedAt)}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
