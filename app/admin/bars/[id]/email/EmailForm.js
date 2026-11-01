'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { sendBarEmail } from './actions';

function Err({ msg }) {
  return msg ? (
    <p className="error" role="alert">
      {msg}
    </p>
  ) : null;
}

export default function EmailForm({ barId, to, subject, body, emailedBefore }) {
  const [state, action, pending] = useActionState(sendBarEmail, {});
  const v = state?.values ?? {};
  const e = state?.errors ?? {};
  return (
    <form className="report" action={action} noValidate>
      <input type="hidden" name="id" value={barId} />
      <Err msg={e.form} />
      <fieldset>
        <label className="field-label" htmlFor="to">
          To
        </label>
        <input id="to" name="to" type="email" defaultValue={v.to ?? to} autoComplete="off" />
        <Err msg={e.to} />
      </fieldset>
      <fieldset>
        <label className="field-label" htmlFor="subject">
          Subject
        </label>
        <input id="subject" name="subject" type="text" defaultValue={v.subject ?? subject} />
        <Err msg={e.subject} />
      </fieldset>
      <fieldset>
        <label className="field-label" htmlFor="body">
          Email
        </label>
        <textarea id="body" name="body" defaultValue={v.body ?? body} rows={22} style={{ minHeight: 420 }} />
        <Err msg={e.body} />
      </fieldset>
      {emailedBefore && (
        <label className="optin" htmlFor="again">
          <input id="again" name="again" type="checkbox" value="yes" defaultChecked={v.again} />
          <span>I know I've emailed this bar before. Send this one too.</span>
        </label>
      )}
      <Err msg={e.again} />
      <div className="actions">
        <button className="btn primary" type="submit" disabled={pending} id="send-email">
          {pending ? 'Sending…' : 'Send email'}
        </button>
        <Link href={`/admin/bars/${barId}`} className="btn">
          Cancel
        </Link>
      </div>
    </form>
  );
}
