'use client';

import { useActionState } from 'react';
import { adminLogin } from '@/app/actions';

export default function LoginForm() {
  const [state, action, pending] = useActionState(adminLogin, {});
  return (
    <form className="login" action={action}>
      <label className="field-label" htmlFor="password">
        Admin password
      </label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {state?.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? 'Checking…' : 'Sign in'}
      </button>
    </form>
  );
}
