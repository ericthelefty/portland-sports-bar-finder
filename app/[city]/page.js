import { getBars } from '@/lib/data';
import { getCity, TAGLINE } from '@/lib/cities';
import Finder from './Finder';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const city = getCity((await params).city);
  if (!city) return {};
  return {
    title: `${city.name} sports bars by TV package`,
    description: `Find ${city.name} bars showing NFL Sunday Ticket, NBA League Pass, NHL Center Ice, MLB Extra Innings and more out-of-market games.`,
    alternates: { canonical: `/${city.slug}` },
  };
}

export default async function CityHome({ params }) {
  const city = getCity((await params).city);
  const bars = await getBars();
  const confirmed = bars.filter((b) => b.packages.some((p) => p.status === 'has')).length;
  const [first, second] = TAGLINE.split('. ');
  return (
    <>
      <header className="hero">
        <div>
          <p className="kicker" id="city-name">
            {city.full}
          </p>
          <h1 id="tagline">
            {first}.
            <br />
            <span>{second}</span>
          </h1>
          <p>
            Find {city.name} bars showing NFL Sunday Ticket, NBA League Pass, NHL Center Ice and more out-of-market
            games.
          </p>
        </div>
        <div className="tally">
          <b>{bars.length}</b>bars listed
          <br />
          {confirmed} with a package confirmed
        </div>
      </header>
      <Finder bars={bars} city={city} />
    </>
  );
}
