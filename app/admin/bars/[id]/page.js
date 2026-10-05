import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getBarForAdmin } from '@/lib/data';
import AdminNav from '../../AdminNav';
import LoginForm from '../../LoginForm';
import BarForm from '../BarForm';
import { deleteBar } from '../actions';
import { DEFAULT_CITY, cityPath } from '@/lib/cities';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit bar', robots: { index: false, follow: false } };

export default async function EditBar({ params, searchParams }) {
  if (!(await isAdmin())) {
    return (
      <>
        <h1 className="page-title">Edit bar</h1>
        <LoginForm />
      </>
    );
  }
  const { id } = await params;
  const sp = await searchParams;
  const bar = await getBarForAdmin(id);
  if (!bar) notFound();

  return (
    <>
      <p className="crumb">
        <Link href="/admin/bars">← All bars</Link>
        {bar.active && (
          <>
            {' · '}
            <Link href={cityPath(DEFAULT_CITY, `/bars/${bar.id}`)}>View on site</Link>
          </>
        )}
      </p>
      <h1 className="page-title" style={{ marginTop: 8 }}>
        {bar.name}
      </h1>
      <AdminNav current="bars" />
      <BarForm bar={bar} />

      <details className="more danger-zone" open={sp?.confirm === '1'} style={{ marginTop: 40, maxWidth: 640 }}>
        <summary>Delete this bar</summary>
        <p className="hint">
          This permanently removes the bar and its package listings. Reports about it stay in your records. To take it off
          the site but keep it, uncheck "Show this bar on the site" instead.
        </p>
        <form action={deleteBar} className="actions">
          <input type="hidden" name="id" value={bar.id} />
          <label className="optin" htmlFor="confirm">
            <input id="confirm" name="confirm" type="checkbox" value="yes" required />
            <span>Yes, delete {bar.name} permanently</span>
          </label>
          <button className="btn danger" type="submit" id="delete-bar">
            Delete bar
          </button>
        </form>
      </details>
    </>
  );
}
