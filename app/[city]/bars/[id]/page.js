import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBar } from '@/lib/data';
import { PACKAGES, SOURCE_LABELS } from '@/lib/constants';
import { formatDate, isStale, mapsUrl } from '@/lib/format';
import { cityPath } from '@/lib/cities';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const bar = await getBar(id);
  if (!bar) return { title: 'Bar not found' };
  return {
    title: `${bar.name}: TV packages`,
    description: `Which out-of-market TV packages ${bar.name} carries, like NFL Sunday Ticket and NBA League Pass.`,
  };
}

export default async function BarPage({ params }) {
  const { id, city } = await params;
  const bar = await getBar(id);
  if (!bar) notFound();
  const report = (q = '') => cityPath(city, `/report?bar=${bar.id}${q}`);
  const byKey = Object.fromEntries(bar.packages.map((p) => [p.package, p]));

  return (
    <article>
      <p className="crumb">
        <Link href={cityPath(city)}>← All bars</Link>
      </p>
      <header className="bar-head">
        {bar.area && <span className="area">{bar.area}</span>}
        <h1 className="page-title" style={{ marginTop: 4 }}>
          {bar.name}
        </h1>
        <p className="lede">
          {bar.type}
          {bar.address ? ` · ${bar.address}` : ''}
        </p>
        <div className="links">
          {bar.website && (
            <a href={bar.website} target="_blank" rel="noopener noreferrer">
              Website
            </a>
          )}
          {bar.facebook && (
            <a href={bar.facebook} target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
          )}
          {bar.instagram && (
            <a href={bar.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}
          <a href={mapsUrl(bar.name, bar.address)} target="_blank" rel="noopener noreferrer">
            Directions
          </a>
        </div>
      </header>

      {bar.teams.length > 0 && (
        <section className="team-box" id="team-bars" aria-label="Team bar">
          {bar.teams.map((t) => (
            <div key={t.team} className="team-line">
              <span className="tag team">{t.team} bar</span>
              <span>
                {t.team} fans meet here for games.
                {t.official && <strong> Official supporters' club.</strong>}
              </span>
              <span className="small mono">
                {SOURCE_LABELS[t.source] ?? t.source}
                {t.lastConfirmed ? `, ${formatDate(t.lastConfirmed)}` : ''}
                {t.lastConfirmed && isStale(t.lastConfirmed) && <span className="stale"> May be out of date</span>}
              </span>
            </div>
          ))}
        </section>
      )}

      {bar.claimsAll && bar.claimText && (
        <blockquote className="quote">
          {bar.claimText.replace(/\s+—\s+\S+$/, '')}
          <div className="small">The bar's website, checked Sept 27, 2026. It doesn't name the packages.</div>
        </blockquote>
      )}

      <h2 className="section-title">TV packages</h2>
      <div className="table-scroll">
        <table className="pk-table">
          <thead>
            <tr>
              <th scope="col">Package</th>
              <th scope="col">Status</th>
              <th scope="col">Source</th>
              <th scope="col">
                <span className="hp">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {PACKAGES.map((p) => {
              const row = byKey[p.key];
              return (
                <tr key={p.key} id={`row-${p.key}`}>
                  <td>{p.label}</td>
                  <td>
                    {!row && <span className="st unk">Unknown</span>}
                    {row?.status === 'has' && <span className="st has">Has it</span>}
                    {row?.status === 'not' && <span className="st not">Reported not available</span>}
                  </td>
                  <td>
                    {row ? (
                      <>
                        <div>{SOURCE_LABELS[row.source] ?? row.source}</div>
                        {row.lastConfirmed && (
                          <div className="small mono">
                            Confirmed {formatDate(row.lastConfirmed)}{' '}
                            {isStale(row.lastConfirmed) && <span className="stale">May be out of date</span>}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="small">No reports yet</span>
                    )}
                  </td>
                  <td>
                    {row?.status === 'has' && (
                      <Link href={report(`&dispute=${p.key}`)} className="small">
                        Not right?
                      </Link>
                    )}
                    {row?.status === 'not' && (
                      <Link href={report(`&has=${p.key}`)} className="small">
                        They have it now?
                      </Link>
                    )}
                    {!row && (
                      <Link href={report(`&has=${p.key}`)} className="small">
                        Report it
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {bar.packages.some((p) => p.source === 'bar_website' && p.evidence) && (
        <blockquote className="quote">
          {bar.packages.find((p) => p.source === 'bar_website' && p.evidence).evidence.replace(/\s+—\s+\S+$/, '')}
          <div className="small">From the bar's website, checked Sept 27, 2026</div>
        </blockquote>
      )}

      <p style={{ marginTop: 20 }}>
        <Link href={report()} className="btn primary">
          Report a TV package here
        </Link>
      </p>

    </article>
  );
}
