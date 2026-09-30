'use client';

import Link from 'next/link';

export default function Error({ error, reset }) {
  return (
    <div className="prose">
      <h1 className="page-title">This page couldn't load</h1>
      <p className="lede">Something went wrong on our end. Try again in a moment.</p>
      <p className="links">
        <button className="btn primary" type="button" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/">All bars</Link>
      </p>
      <p className="small" style={{ marginTop: 24 }}>
        Running this site? Open <Link href="/status">/status</Link> to check its settings.
        {error?.digest ? ` Error code: ${error.digest}` : ''}
      </p>
    </div>
  );
}
