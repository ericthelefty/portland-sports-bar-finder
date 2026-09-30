import { getBars } from '@/lib/data';
import Finder from './Finder';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const bars = await getBars();
  const confirmed = bars.filter((b) => b.packages.some((p) => p.status === 'has')).length;
  return (
    <>
      <header className="hero">
        <div>
          <h1>
            Find the <span>game</span>
            <br />
            in Portland
          </h1>
          <p>Sports bars in Portland, Oregon, and the out-of-market TV packages they carry.</p>
        </div>
        <div className="tally">
          <b>{bars.length}</b>bars listed
          <br />
          {confirmed} with a package confirmed
        </div>
      </header>
      <Finder bars={bars} />
    </>
  );
}
