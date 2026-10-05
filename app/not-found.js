import Link from 'next/link';
import { DEFAULT_CITY, cityPath } from '@/lib/cities';

export default function NotFound() {
  return (
    <div className="prose">
      <h1 className="page-title">Page not found</h1>
      <p className="lede">We couldn't find that page. The bar may have been removed or the link may be mistyped.</p>
      <p className="links">
        <Link href={cityPath(DEFAULT_CITY)}>See all bars</Link>
      </p>
    </div>
  );
}
