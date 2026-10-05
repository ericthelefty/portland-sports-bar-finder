import Link from 'next/link';
import { cityPath } from '@/lib/cities';

export const metadata = { title: 'Report received' };

export default async function Thanks({ params }) {
  const { city } = await params;
  return (
    <div className="prose">
      <h1 className="page-title">Thanks for the report</h1>
      <p className="lede">We got it. We review every report before it appears on the site.</p>
      <p className="links">
        <Link href={cityPath(city)}>Back to all bars</Link>
        <Link href={cityPath(city, '/report')}>Report another bar</Link>
      </p>
    </div>
  );
}
