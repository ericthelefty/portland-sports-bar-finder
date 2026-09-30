import Link from 'next/link';

export const metadata = { title: 'Report received' };

export default async function Thanks({ searchParams }) {
  const sp = await searchParams;
  const emailed = sp?.check === 'email';
  return (
    <div className="prose">
      <h1 className="page-title">{emailed ? 'Check your email' : 'Thanks for the report'}</h1>
      {emailed ? (
        <p className="lede">
          We sent you a link to confirm your email address. Click it and your report goes into our review queue. The
          link works once.
        </p>
      ) : (
        <p className="lede">We got your report. We'll review it before it appears on the site.</p>
      )}
      <p className="links">
        <Link href="/">Back to all bars</Link>
        <Link href="/report">Report another bar</Link>
      </p>
    </div>
  );
}
