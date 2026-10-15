'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CITY_LIST, getCity, cityPath } from '@/lib/cities';

// The city the visitor is looking at, from the address (/pdx/..., /slc/...), or null on other pages.
function useCity() {
  const first = (usePathname() || '/').split('/')[1];
  return getCity(first);
}

// Top menu: inside a city, links to that city and its report form; elsewhere, a link to each city.
export function NavLinks() {
  const city = useCity();
  if (!city) {
    return (
      <div className="nav-links">
        {CITY_LIST.map((c) => (
          <Link key={c.slug} href={cityPath(c.slug)} id={`nav-${c.slug}`}>
            {c.slug === 'slc' ? 'SLC' : c.name}
          </Link>
        ))}
      </div>
    );
  }
  return (
    <div className="nav-links">
      <Link href={cityPath(city.slug)} id="nav-city">
        {city.slug === 'slc' ? 'SLC' : city.name}
      </Link>
      <Link href={cityPath(city.slug, '/report')} className="nav-cta">
        Report a TV package
      </Link>
    </div>
  );
}

// Footer link to the report form for the city being viewed, or to the city picker elsewhere.
export function FooterReportLink() {
  const city = useCity();
  return city ? (
    <Link href={cityPath(city.slug, '/report')}>Report a TV package</Link>
  ) : (
    <Link href="/#pick-city">Pick a city</Link>
  );
}
