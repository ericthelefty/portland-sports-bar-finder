import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import AdminNav from '../../AdminNav';
import LoginForm from '../../LoginForm';
import BarForm from '../BarForm';
import { getCity } from '@/lib/cities';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add a bar', robots: { index: false, follow: false } };

export default async function NewBar({ searchParams }) {
  const sp = await searchParams;
  if (!(await isAdmin())) {
    return (
      <>
        <h1 className="page-title">Add a bar</h1>
        <LoginForm />
      </>
    );
  }
  return (
    <>
      <p className="crumb">
        <Link href="/admin/bars">← All bars</Link>
      </p>
      <h1 className="page-title" style={{ marginTop: 8 }}>
        Add a bar
      </h1>
      <AdminNav current="bars" />
      <BarForm bar={null} defaultCity={getCity(sp?.city)?.slug} />
    </>
  );
}
