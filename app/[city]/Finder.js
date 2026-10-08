'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PACKAGES, AREAS, packageLabel } from '@/lib/constants';
import { shortAddress } from '@/lib/format';
import { cityPath } from '@/lib/cities';
import { norm, searchTerms } from '@/lib/text';
import { teamNames } from '@/lib/teams';

const hasPkg = (bar, key) => bar.packages.some((p) => p.package === key && p.status === 'has');

// Search text for each bar: name, address (with ZIP), type and team tags.
// Team tags count under every name the team goes by ("spurs" finds a Tottenham Hotspur bar).
const haystack = (b) => norm(`${b.name} ${b.address} ${b.type} ${b.teams.flatMap((t) => teamNames(t.team)).join(' ')}`);
const teamMatches = (team, terms) =>
  terms.length > 0 && teamNames(team).some((name) => terms.every((t) => norm(name).includes(t)));

export default function Finder({ bars, city }) {
  const [picked, setPicked] = useState([]);
  const [area, setArea] = useState('all');
  const [query, setQuery] = useState('');
  const [onlyKnown, setOnlyKnown] = useState(false);

  const counts = useMemo(
    () => Object.fromEntries(PACKAGES.map((p) => [p.key, bars.filter((b) => hasPkg(b, p.key)).length])),
    [bars]
  );

  const terms = useMemo(() => searchTerms(query), [query]);
  const isTeamBar = (b) => b.teams.some((t) => teamMatches(t.team, terms));

  const rows = useMemo(() => {
    const teamBar = (b) => b.teams.some((t) => teamMatches(t.team, terms));
    return bars
      .filter((b) => {
        if (area !== 'all' && b.area !== area) return false;
        if (onlyKnown && !b.packages.some((p) => p.status === 'has')) return false;
        if (!picked.every((k) => hasPkg(b, k))) return false;
        if (terms.length) {
          const hay = haystack(b);
          if (!terms.every((t) => hay.includes(t))) return false;
        }
        return true;
      })
      .sort((x, y) => {
        // Searching a team puts that team's bars first.
        const tx = Number(teamBar(x));
        const ty = Number(teamBar(y));
        const hx = x.packages.filter((p) => p.status === 'has').length;
        const hy = y.packages.filter((p) => p.status === 'has').length;
        return ty - tx || hy - hx || Number(y.claimsAll) - Number(x.claimsAll) || x.name.localeCompare(y.name);
      });
  }, [bars, picked, area, terms, onlyKnown]);

  const toggle = (key) => setPicked((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
  const filterText = [
    picked.length ? `with ${picked.map(packageLabel).join(' + ')}` : '',
    area !== 'all' ? `in ${area} ${city.name}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <section className="filters" aria-label="Filters">
        <div className="row" role="group" aria-labelledby="lbl-pk">
          <span className="label" id="lbl-pk">
            Package
          </span>
          <div className="row">
            {PACKAGES.map((p) => (
              <button
                key={p.key}
                id={`pk-${p.key}`}
                type="button"
                className="chip"
                aria-pressed={picked.includes(p.key)}
                onClick={() => toggle(p.key)}
              >
                {p.label} <span className="n">{counts[p.key]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <span className="label" id="lbl-area">
            Area
          </span>
          <div className="seg" role="group" aria-labelledby="lbl-area">
            {['all', ...AREAS].map((a) => (
              <button key={a} id={`area-${a}`} type="button" aria-pressed={area === a} onClick={() => setArea(a)}>
                {a === 'all' ? 'All' : a}
              </button>
            ))}
          </div>
          <input
            className="search"
            id="q"
            type="search"
            inputMode="search"
            placeholder="Search by bar, team or ZIP code"
            aria-label="Search by bar, team or ZIP code"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="row">
          <span className="label">Show</span>
          <label className="toggle">
            <input id="only-known" type="checkbox" checked={onlyKnown} onChange={(e) => setOnlyKnown(e.target.checked)} />
            Only bars with a confirmed package
          </label>
        </div>
      </section>

      <p className="note">
        <strong>Blank doesn't mean no.</strong> Most bars don't list their TV packages online, so a bar without tags may
        still carry them. Know what a bar has? <Link href={cityPath(city.slug, '/report')}>Report it</Link> and we'll add it after a quick
        review.
      </p>

      <p className="status-line" aria-live="polite" id="result-count">
        {rows.length} of {bars.length} bars{filterText ? ` ${filterText}` : ''}
      </p>

      {rows.length === 0 ? (
        <p className="empty">
          No bar has confirmed {picked.length ? picked.map(packageLabel).join(' + ') : 'a match'}
          {area !== 'all' ? ` in ${area} ${city.name}` : ''} yet. Try fewer packages or another area. Bars marked "every
          package" may carry it too.
        </p>
      ) : (
        <ul className="bars">
          {rows.map((b) => (
            <li key={b.id} className="bar">
              <Link href={cityPath(city.slug, `/bars/${b.id}`)} className="bar-row">
                <span className="area" aria-label={`Area ${b.area || 'unknown'}`}>
                  {b.area || '—'}
                </span>
                <div>
                  <h2 className="name">{b.name}</h2>
                  <div className="meta">
                    {b.type}
                    {b.address ? ` · ${shortAddress(b.address)}` : ''}
                  </div>
                  {b.teams.length > 0 && (
                    <div className="teams">
                      {b.teams.map((t) => (
                        <span
                          key={t.team}
                          className={`tag team${isTeamBar(b) && teamMatches(t.team, terms) ? ' hit' : ''}`}
                          title={`${t.team} fans meet here for games`}
                        >
                          {t.team} bar
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="pk">
                    {b.packages
                      .filter((p) => p.status === 'has')
                      .map((p) => (
                        <span
                          key={p.package}
                          className={`tag${picked.includes(p.package) ? ' hit' : ''}${p.source === 'fan' ? ' fan' : ''}`}
                        >
                          {packageLabel(p.package)}
                        </span>
                      ))}
                    {b.claimsAll && <span className="tag all">Says "every package"</span>}
                    {!b.packages.some((p) => p.status === 'has') && !b.claimsAll && (
                      <span className="tag unk">Packages unknown</span>
                    )}
                  </div>
                </div>
                <span className="go" aria-hidden="true">
                  Details →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
