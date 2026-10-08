'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BarTable({ bars }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const rows = query ? bars.filter((b) => `${b.name} ${b.address} ${b.teams}`.toLowerCase().includes(query)) : bars;
  return (
    <>
      <input
        className="search"
        id="bar-search"
        type="search"
        placeholder="Find a bar by name, street or team"
        aria-label="Find a bar"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ width: '100%', marginTop: 16 }}
      />
      <div className="table-scroll">
        <table className="cmp" id="bar-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th scope="col">Bar</th>
              <th scope="col">Area</th>
              <th scope="col">Packages</th>
              <th scope="col">On site</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} data-bar={b.id}>
                <td>
                  <Link href={`/admin/bars/${b.id}`}>{b.name}</Link>
                  {b.address && <div className="small">{b.address}</div>}
                  {b.teams && <div className="small">Team bar: {b.teams}</div>}
                </td>
                <td>{b.area || '—'}</td>
                <td className="mono">{b.hasCount}</td>
                <td>{b.active ? 'Yes' : <span className="flag plain">Hidden</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="empty">No bars match "{q}".</p>}
    </>
  );
}
