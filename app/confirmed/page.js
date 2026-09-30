import Link from 'next/link';

export const metadata = { title: 'Email confirmed' };

export default async function Confirmed({ searchParams }) {
  const sp = await searchParams;
  const invalid = sp?.invalid === '1';
  return (
    <div className="prose">
      <h1 className="page-title">{invalid ? 'That link has expired' : 'Email confirmed'}</h1>
      <p className="lede">
        {invalid
          ? 'This confirmation link was already used or is incomplete. If you already clicked it once, your report is in the queue.'
          : "Thanks. Your report is now in our review queue, and we'll add it to the site once it's checked."}
      </p>
      <p className="links">
        <Link href="/">Back to all bars</Link>
      </p>
    </div>
  );
}
