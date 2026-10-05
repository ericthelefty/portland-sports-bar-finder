'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { submitReport } from '@/app/actions';
import BarPicker from './BarPicker';
import { PACKAGES, RELATIONS, AREAS } from '@/lib/constants';

function Err({ msg, id }) {
  return msg ? (
    <p className="error" id={id} role="alert">
      {msg}
    </p>
  ) : null;
}

// Cloudflare Turnstile "Verify you are human" check. Renders only when the site has keys set.
function useCaptcha(siteKey, state) {
  const box = useRef(null);
  const widget = useRef(null);
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!siteKey || !ready || !box.current || widget.current !== null || !window.turnstile) return;
    widget.current = window.turnstile.render(box.current, {
      sitekey: siteKey,
      theme: 'auto',
      'response-field': false,
      callback: (t) => setToken(t),
      'expired-callback': () => setToken(''),
      'error-callback': () => setToken(''),
    });
  }, [siteKey, ready]);

  // Each pass works once, so get a fresh one after a submission comes back with errors.
  useEffect(() => {
    if (state?.errors && widget.current !== null && window.turnstile) {
      window.turnstile.reset(widget.current);
      setToken('');
    }
  }, [state]);

  useEffect(() => {
    if (siteKey && typeof window !== 'undefined' && window.turnstile) setReady(true);
    return () => {
      if (widget.current !== null && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey]);

  return { box, token, onLoad: () => setReady(true) };
}

export default function ReportForm({ bars, initial, captchaSiteKey, city }) {
  const [state, action, pending] = useActionState(submitReport, { values: {} });
  const captcha = useCaptcha(captchaSiteKey, state);
  const v = state?.values ?? {};
  const e = state?.errors ?? {};
  const [barId, setBarId] = useState(v.barId ?? initial.barId ?? '');
  const [newBarName, setNewBarName] = useState(v.newBarName ?? '');
  const has = v.has ?? initial.has;
  const not = v.not ?? initial.not;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form className="report" action={action} noValidate>
      {e.form && <p className="form-error">{e.form}</p>}
      <input type="hidden" name="city" value={city.slug} />

      <fieldset>
        <label className="field-label" htmlFor="barSearch">
          Which bar?
        </label>
        <BarPicker bars={bars} value={barId} onChange={setBarId} onAddNew={setNewBarName} invalid={Boolean(e.barId)} />
        <Err msg={e.barId} />
        {barId === 'new' && (
          <div style={{ display: 'grid', gap: 10, marginTop: 6 }}>
            <label className="field-label" htmlFor="newBarName">
              Bar name
            </label>
            <input
              id="newBarName"
              name="newBarName"
              type="text"
              value={newBarName}
              onChange={(ev) => setNewBarName(ev.target.value)}
              autoComplete="off"
            />
            <Err msg={e.newBarName} />
            <label className="field-label" htmlFor="newBarAddress">
              Street address
            </label>
            <input
              id="newBarAddress"
              name="newBarAddress"
              type="text"
              placeholder="e.g. 1234 SE Division St"
              defaultValue={v.newBarAddress}
            />
            <Err msg={e.newBarAddress} />
            <label className="field-label" htmlFor="newBarArea">
              Part of town (optional)
            </label>
            <select id="newBarArea" name="newBarArea" defaultValue={v.newBarArea ?? ''}>
              <option value="">Not sure</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a} {city.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </fieldset>

      <fieldset aria-describedby="has-hint">
        <legend>Which packages does this bar have?</legend>
        <p className="hint" id="has-hint">
          Check all you've seen.
        </p>
        <div className="checks">
          {PACKAGES.map((p) => (
            <label className="check" key={p.key}>
              <input type="checkbox" name="has" value={p.key} id={`has-${p.key}`} defaultChecked={has.includes(p.key)} />
              {p.label}
            </label>
          ))}
        </div>
        <label className="field-label" htmlFor="otherPackage" style={{ marginTop: 6, fontWeight: 600 }}>
          Other package (optional)
        </label>
        <input id="otherPackage" name="otherPackage" type="text" placeholder="e.g. UFC pay-per-view" defaultValue={v.otherPackage} />
        <Err msg={e.has} />
      </fieldset>

      <details className="more" open={not.length > 0}>
        <summary>Know a package they DON'T have? (optional)</summary>
        <p className="hint">Only check these if you asked or confirmed it. Unchecked boxes above don't count as "no."</p>
        <div className="checks">
          {PACKAGES.map((p) => (
            <label className="check" key={p.key}>
              <input type="checkbox" name="not" value={p.key} id={`not-${p.key}`} defaultChecked={not.includes(p.key)} />
              {p.label}
            </label>
          ))}
        </div>
      </details>

      <fieldset>
        <legend>How do you know?</legend>
        {RELATIONS.map((r) => (
          <label className="radio" key={r.key}>
            <input type="radio" name="relation" value={r.key} id={`rel-${r.key}`} defaultChecked={v.relation === r.key} />
            {r.label}
          </label>
        ))}
        <Err msg={e.relation} />
      </fieldset>

      <div className="two">
        <fieldset>
          <label className="field-label" htmlFor="seenOn">
            When did you see it? (optional)
          </label>
          <input id="seenOn" name="seenOn" type="date" max={today} defaultValue={v.seenOn} />
          <Err msg={e.seenOn} />
        </fieldset>
        <fieldset>
          <label className="field-label" htmlFor="link">
            Link to a post or photo (optional)
          </label>
          <input id="link" name="link" type="url" placeholder="https://" defaultValue={v.link} />
          <Err msg={e.link} />
        </fieldset>
      </div>

      <fieldset>
        <label className="field-label" htmlFor="note">
          Anything else? (optional)
        </label>
        <textarea id="note" name="note" defaultValue={v.note} placeholder="e.g. They put Sunday Ticket games on the back-room TVs." />
      </fieldset>

      <div className="hp" aria-hidden="true">
        <label htmlFor="website_url">Leave this empty</label>
        <input id="website_url" name="website_url" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {captchaSiteKey && (
        <fieldset>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onReady={captcha.onLoad}
          />
          <div ref={captcha.box} id="captcha" />
          <input type="hidden" name="captchaToken" value={captcha.token} readOnly />
          <Err msg={e.captcha} />
        </fieldset>
      )}

      <div className="actions">
        <button className="btn primary" type="submit" disabled={pending || (captchaSiteKey && !captcha.token)} id="send-report">
          {pending ? 'Sending…' : 'Send report'}
        </button>
        {captchaSiteKey && !captcha.token && <span className="small">Complete the check above to send.</span>}
        <span className="small">
          See our <Link href="/privacy">privacy policy</Link>.
        </span>
      </div>
    </form>
  );
}
