import Link from 'next/link';
import { getCityStats } from '@/lib/data';
import { PACKAGES } from '@/lib/constants';
import { BRAND, TAGLINE, CITIES, cityPath } from '@/lib/cities';

export const dynamic = 'force-dynamic';
export const metadata = { alternates: { canonical: '/' } };

export default async function Home() {
  // Bars aren't split by city yet, so every city card shows the one city's numbers.
  const stats = await getCityStats();
  const [first, second] = TAGLINE.split(', ');
  const cities = Object.values(CITIES);

  return (
    <div className="home">
      <header className="brand-hero">
        <h1 id="tagline">
          {first},
          <br />
          <span>{second}</span>
        </h1>
        <p className="brand-lede">
          {BRAND} finds sports bars showing the games your local TV doesn't: NFL Sunday Ticket, NBA League Pass, NHL
          Center Ice and more.
        </p>
        <p className="oom-def" id="oom-def">
          <b>OOM</b> <span className="pron">/oom/</span> <i>short for</i> out-of-market. A game that isn't on TV where you
          live, usually because your team is from somewhere else.
        </p>
      </header>

      <section aria-labelledby="pick-city">
        <h2 className="section-title" id="pick-city">
          Pick your city
        </h2>
        <ul className="city-cards">
          {cities.map((c) => (
            <li key={c.slug}>
              <Link href={cityPath(c.slug)} className="city-card" id={`city-${c.slug}`}>
                <span className="city-slug">/{c.slug}</span>
                <span className="city-name">{c.name}</span>
                <span className="city-meta">
                  {stats.bars} bars · {stats.confirmed} with a package confirmed
                </span>
                <span className="city-go">Find a bar →</span>
              </Link>
            </li>
          ))}
          <li className="city-soon" aria-label="More cities coming">
            <span className="city-name">More cities soon</span>
            <span className="city-meta">Starting where the out-of-market fans are.</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="how">
        <h2 className="section-title" id="how">
          How it works
        </h2>
        <ol className="how-steps">
          <li>
            <b>Pick your package.</b> Filter bars by the out-of-market TV packages they carry.
          </li>
          <li>
            <b>Find your bar.</b> See where each listing came from and when it was last confirmed.
          </li>
          <li>
            <b>Report what you see.</b> Spot a package at a bar? Tell us and we'll add it after a quick review.
          </li>
        </ol>
        <p className="pk-list" aria-label="Packages we track">
          {PACKAGES.map((p) => (
            <span key={p.key} className="tag">
              {p.label}
            </span>
          ))}
        </p>
      </section>
    </div>
  );
}
