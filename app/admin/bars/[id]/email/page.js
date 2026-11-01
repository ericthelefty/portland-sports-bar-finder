import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getBarForAdmin } from '@/lib/data';
import { outreachDraft } from '@/lib/outreach';
import { formatDate } from '@/lib/format';
import { CONTACT_EMAIL } from '@/lib/cities';
import AdminNav from '../../../AdminNav';
import LoginForm from '../../../LoginForm';
import EmailForm from './EmailForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Email a bar', robots: { index: false, follow: false } };

export default async function EmailBar({ params }) {
  if (!(await isAdmin())) {
    return (
      <>
        <h1 className="page-title">Email a bar</h1>
        <LoginForm />
      </>
    );
  }
  const { id } = await params;
  const bar = await getBarForAdmin(id);
  if (!bar) notFound();
  const draft = outreachDraft(bar);

  return (
    <>
      <p className="crumb">
        <Link href={`/admin/bars/${bar.id}`}>← {bar.name}</Link>
      </p>
      <h1 className="page-title" style={{ marginTop: 8 }}>
        Email {bar.name}
      </h1>
      <AdminNav current="bars" />
      <p className="hint" style={{ marginTop: 16, maxWidth: 640 }}>
        Sent from Eric from Oombar &lt;{CONTACT_EMAIL}&gt;. Replies go to {CONTACT_EMAIL}, and a copy of this email goes
        there too. Edit anything before you send.
      </p>
      {bar.emails.length > 0 && (
        <div className="notice" id="emailed-before" style={{ maxWidth: 640 }}>
          Already emailed:{' '}
          {bar.emails.map((m) => `${formatDate(m.sentOn)} (${m.to})`).join(', ')}
        </div>
      )}
      {!bar.contactEmail && (
        <p className="hint" id="no-contact-email" style={{ maxWidth: 640 }}>
          This bar has no contact email saved. Type one in, or add it on the bar's edit page.
        </p>
      )}
      <EmailForm
        barId={bar.id}
        to={bar.contactEmail}
        subject={draft.subject}
        body={draft.body}
        emailedBefore={bar.emails.length > 0}
      />
    </>
  );
}
