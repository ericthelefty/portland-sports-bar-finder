import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="prose">
      <h1 className="page-title">Page not found</h1>
      <p className="lede">We couldn't find that page. The bar may have been removed or the link may be mistyped.</p>
      <p className="links">
        <Link href="/">See all bars</Link>
      </p>
    </div>
  );
}
