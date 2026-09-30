import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import AdminNav from '../../AdminNav';
import LoginForm from '../../LoginForm';
import BarForm from '../BarForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add a bar', robots: { index: false, follow: false } };

export default async function NewBar() {
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
      <BarForm bar={null} />
    </>
  );
}
