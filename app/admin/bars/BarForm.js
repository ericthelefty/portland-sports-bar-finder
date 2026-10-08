'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { saveBar } from './actions';
import { PACKAGES, AREAS, SOURCE_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import TeamOptions from '@/app/TeamOptions';

function Err({ msg }) {
  return msg ? (
    <p className="error" role="alert">
      {msg}
    </p>
  ) : null;
}

export default function BarForm({ bar }) {
  const [state, action, pending] = useActionState(saveBar, {});
  const v = state?.values ?? {};
  const e = state?.errors ?? {};
  const val = (k) => v[k] ?? bar?.[k] ?? '';
  const current = Object.fromEntries((bar?.packages ?? []).map((p) => [p.package, p]));
  const pkgValue = (k) => v.pkgs?.[k] ?? current[k]?.status ?? 'unknown';
  const active = v.active ?? bar?.active ?? true;
  const claimsAll = v.claimsAll ?? bar?.claimsAll ?? false;
  const teams = bar?.teams ?? [];
  const newTeams = v.newTeams ?? [];

  return (
    <form className="report" action={action} noValidate>
      {bar?.id && <input type="hidden" name="id" value={bar.id} />}

      <fieldset>
        <label className="field-label" htmlFor="name">
          Bar name
        </label>
        <input id="name" name="name" type="text" defaultValue={val('name')} required />
        <Err msg={e.name} />
      </fieldset>

      <div className="two">
        <fieldset>
          <label className="field-label" htmlFor="type">
            Type
          </label>
          <input id="type" name="type" type="text" placeholder="e.g. Sports bar, Brewery, Pub" defaultValue={val('type')} />
        </fieldset>
        <fieldset>
          <label className="field-label" htmlFor="area">
            Part of town
          </label>
          <select id="area" name="area" defaultValue={val('area')}>
            <option value="">Not set</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a} Portland
              </option>
            ))}
          </select>
          <Err msg={e.area} />
        </fieldset>
      </div>

      <fieldset>
        <label className="field-label" htmlFor="address">
          Street address
        </label>
        <input id="address" name="address" type="text" placeholder="e.g. 1234 SE Division St, Portland, OR 97202" defaultValue={val('address')} />
      </fieldset>

      <fieldset>
        <label className="field-label" htmlFor="website">
          Website
        </label>
        <input id="website" name="website" type="url" placeholder="https://" defaultValue={val('website')} />
        <Err msg={e.website} />
        <div className="two">
          <div>
            <label className="field-label" htmlFor="facebook">
              Facebook page
            </label>
            <input id="facebook" name="facebook" type="url" placeholder="https://www.facebook.com/…" defaultValue={val('facebook')} />
            <Err msg={e.facebook} />
          </div>
          <div>
            <label className="field-label" htmlFor="instagram">
              Instagram
            </label>
            <input id="instagram" name="instagram" type="url" placeholder="https://www.instagram.com/…" defaultValue={val('instagram')} />
            <Err msg={e.instagram} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>TV packages</legend>
        <p className="hint">Changes are marked "Confirmed by the site" with today's date. Packages you leave alone keep their source.</p>
        <div className="table-scroll">
          <table className="cmp">
            <thead>
              <tr>
                <th scope="col">Package</th>
                <th scope="col">Has it</th>
                <th scope="col">Doesn't have</th>
                <th scope="col">Unknown</th>
              </tr>
            </thead>
            <tbody>
              {PACKAGES.map((p) => (
                <tr key={p.key}>
                  <td>
                    <strong>{p.label}</strong>
                    {current[p.key] && (
                      <div className="small">
                        {SOURCE_LABELS[current[p.key].source] ?? current[p.key].source}
                        {current[p.key].lastConfirmed ? `, ${formatDate(current[p.key].lastConfirmed)}` : ''}
                      </div>
                    )}
                  </td>
                  {['has', 'not', 'unknown'].map((s) => (
                    <td key={s}>
                      <input
                        type="radio"
                        name={`pkg_${p.key}`}
                        value={s}
                        id={`pkg_${p.key}_${s}`}
                        defaultChecked={pkgValue(p.key) === s}
                        aria-label={`${p.label}: ${s === 'has' ? 'has it' : s === 'not' ? "doesn't have it" : 'unknown'}`}
                        style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <label className="optin" htmlFor="claimsAll" style={{ marginTop: 8 }}>
          <input id="claimsAll" name="claimsAll" type="checkbox" value="yes" defaultChecked={claimsAll} />
          <span>Bar says it carries "every package" without naming them</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>Team bar</legend>
        <p className="hint">
          Teams whose fans meet here for games. Searching a team on the site finds these bars first. Uncheck a team to
          remove it.
        </p>
        {teams.length > 0 && (
          <ul className="team-edit" id="team-edit">
            {teams.map((t, i) => (
              <li key={t.team}>
                <label className="check">
                  <input type="checkbox" name="teamKeep" value={t.team} id={`team-keep-${i}`} defaultChecked />
                  <strong>{t.team}</strong>
                </label>
                <span className="small">
                  {SOURCE_LABELS[t.source] ?? t.source}
                  {t.lastConfirmed ? `, ${formatDate(t.lastConfirmed)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
        <ul className="team-edit">
          {[0, 1].map((i) => (
            <li key={i}>
              <input
                type="text"
                name={`newTeam_${i}`}
                id={`newTeam_${i}`}
                list="admin-team-list"
                autoComplete="off"
                placeholder={i === 0 ? 'Add a team, e.g. Cleveland Browns' : 'Add another team'}
                aria-label="Add a team"
                defaultValue={newTeams[i]?.team}
              />
            </li>
          ))}
        </ul>
        <TeamOptions id="admin-team-list" />
      </fieldset>

      <fieldset>
        <label className="field-label" htmlFor="notes">
          Private notes
        </label>
        <p className="hint">Only you see these.</p>
        <textarea id="notes" name="notes" defaultValue={val('notes')} />
      </fieldset>

      <label className="optin" htmlFor="active">
        <input id="active" name="active" type="checkbox" value="yes" defaultChecked={active} />
        <span>
          <strong>Show this bar on the site.</strong> Uncheck to hide it without deleting it.
        </span>
      </label>

      <div className="actions">
        <button className="btn primary" type="submit" disabled={pending} id="save-bar">
          {pending ? 'Saving…' : bar?.id ? 'Save changes' : 'Add bar'}
        </button>
        <Link href="/admin/bars" className="btn">
          Cancel
        </Link>
      </div>
    </form>
  );
}
