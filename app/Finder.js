'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PACKAGES, AREAS, packageLabel } from '@/lib/constants';
import { shortAddress } from '@/lib/format';

const hasPkg = (bar, key) => bar.packages.some((p) => p.package === key && p.status === 'has');

export default function Finder({ bars }) {
  const [picked, setPicked] = useState([]);
  const [area, setArea] = useState('all');
  const [query, setQuery] = useState('');
  const [onlyKnown, setOnlyKnown] = useState(false);

  const counts = useMemo(
    () => Object.fromEntries(PACKAGES.map((p) => [p.key, bars.filter((b) => hasPkg(b, p.key)).length])),
    [bars]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bars
      .filter((b) => {
        if (area !== 'all' && b.area !== area) return false;
        if (onlyKnown && !b.packages.some((p) => p.status === 'has')) return false;
        if (!picked.every((k) => hasPkg(b, k))) return false;
        if (q && !`${b.name} ${b.address} ${b.type}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((x, y) => {
        const hx = x.packages.filter((p) => p.status === 'has').length;
        const hy = y.packages.filter((p) => p.status === 'has').length;
        return hy - hx || Number(y.claimsAll) - Number(x.claimsAll) || x.name.localeCompare(y.name);
      });
  }, [bars, picked, area, query, onlyKnown]);

  const toggle = (key) => setPicked((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
  const filterText = [
    picked.length ? `with ${picked.map(packageLabel).join(' + ')}` : '',
    area !== 'all' ? `in ${area} Portland` : '',
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
            placeholder="Search by bar, street or team"
            aria-label="Search bars"
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
        still carry them. Know what a bar has? <Link href="/report">Report it</Link> and we'll add it after a quick
        review.
      </p>

      <p className="status-line" aria-live="polite" id="result-count">
        {rows.length} of {bars.length} bars{filterText ? ` ${filterText}` : ''}
      </p>

      {rows.length === 0 ? (
        <p className="empty">
          No bar has confirmed {picked.length ? picked.map(packageLabel).join(' + ') : 'a match'}
          {area !== 'all' ? ` in ${area} Portland` : ''} yet. Try fewer packages or another area. Bars marked "every
          package" may carry it too.
        </p>
      ) : (
        <ul className="bars">
          {rows.map((b) => (
            <li key={b.id} className="bar">
              <Link href={`/bars/${b.id}`} className="bar-row">
                <span className="area" aria-label={`Area ${b.area || 'unknown'}`}>
                  {b.area || '—'}
                </span>
                <div>
                  <h2 className="name">{b.name}</h2>
                  <div className="meta">
                    {b.type}
                    {b.address ? ` · ${shortAddress(b.address)}` : ''}
                  </div>
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
