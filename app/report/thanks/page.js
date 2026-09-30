import Link from 'next/link';

export const metadata = { title: 'Report received' };

export default function Thanks() {
  return (
    <div className="prose">
      <h1 className="page-title">Thanks for the report</h1>
      <p className="lede">We got it. We review every report before it appears on the site.</p>
      <p className="links">
        <Link href="/">Back to all bars</Link>
        <Link href="/report">Report another bar</Link>
      </p>
    </div>
  );
}
