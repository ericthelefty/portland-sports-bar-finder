import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { getAllBarsForAdmin } from '@/lib/data';
import { shortAddress } from '@/lib/format';
import AdminNav from '../AdminNav';
import LoginForm from '../LoginForm';
import BarTable from './BarTable';
import { DEFAULT_CITY, cityPath } from '@/lib/cities';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage bars', robots: { index: false, follow: false } };

export default async function ManageBars({ searchParams }) {
  if (!(await isAdmin())) {
    return (
      <>
        <h1 className="page-title">Manage bars</h1>
        <p className="lede">Enter the admin password to manage bars.</p>
        <LoginForm />
      </>
    );
  }
  const sp = await searchParams;
  const bars = await getAllBarsForAdmin();
  const saved = sp?.saved ? bars.find((b) => String(b.id) === sp.saved) : null;
  const visible = bars.filter((b) => b.active).length;

  return (
    <>
      <h1 className="page-title">Manage bars</h1>
      <AdminNav current="bars" />
      {saved && (
        <p className="notice" role="status" id="saved-notice">
          Saved {saved.name}.{' '}
          {saved.active && <Link href={cityPath(DEFAULT_CITY, `/bars/${saved.id}`)}>View it on the site</Link>}
        </p>
      )}
      {sp?.deleted && (
        <p className="notice" role="status">
          Bar deleted.
        </p>
      )}
      <div className="admin-bar">
        <div className="stats">
          <div>
            <b id="visible-count">{visible}</b>on the site
          </div>
          <div>
            <b>{bars.length - visible}</b>hidden
          </div>
        </div>
        <Link href="/admin/bars/new" className="btn primary" id="add-bar">
          Add a bar
        </Link>
      </div>
      <BarTable
        bars={bars.map((b) => ({
          id: b.id,
          name: b.name,
          area: b.area,
          address: shortAddress(b.address),
          active: b.active,
          hasCount: b.has_count,
        }))}
      />
    </>
  );
}
