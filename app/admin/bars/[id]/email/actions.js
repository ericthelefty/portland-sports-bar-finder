'use server';

import { redirect } from 'next/navigation';
import { sql, ensureDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { emailBar } from '@/lib/notify';

// At most this many bar emails in 24 hours. Many cold emails at once from a new domain land in spam,
// which would also hurt the report emails sent from the same domain.
const DAILY_LIMIT = 10;

export async function sendBarEmail(_prev, formData) {
  if (!(await isAdmin())) redirect('/admin');
  const id = Number(formData.get('id'));
  const values = {
    to: String(formData.get('to') ?? '').trim().toLowerCase().slice(0, 200),
    subject: String(formData.get('subject') ?? '').trim().slice(0, 200),
    body: String(formData.get('body') ?? '').replace(/\r\n/g, '\n').trim().slice(0, 6000),
    again: formData.get('again') === 'yes',
  };
  const errors = {};
  if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(values.to)) errors.to = "That doesn't look like an email address.";
  if (values.subject.length < 3) errors.subject = 'Add a subject.';
  if (values.body.length < 20) errors.body = 'Write the email.';
  if (Object.keys(errors).length) return { values, errors };

  await ensureDb();
  const [bar] = await sql`select id from bars where id = ${id}`;
  if (!bar) return { values, errors: { form: 'That bar no longer exists.' } };
  const [{ before }] = await sql`select count(*)::int as before from bar_emails where bar_id = ${id}`;
  if (before > 0 && !values.again) {
    return { values, errors: { again: 'You have emailed this bar before. Check the box to send another.' } };
  }
  const [{ today }] = await sql`select count(*)::int as today from bar_emails where sent_at > now() - interval '24 hours'`;
  if (today >= DAILY_LIMIT) {
    return { values, errors: { form: `You've sent ${DAILY_LIMIT} bar emails in the last 24 hours. Wait a day so they don't land in spam.` } };
  }

  const sent = await emailBar(values);
  if (!sent.ok) {
    console.error('Bar email failed:', sent.error);
    return {
      values,
      errors: {
        form:
          sent.error === 'not set up'
            ? 'Email sending is not set up. Add RESEND_API_KEY in Vercel.'
            : 'The email did not send. Try again in a minute.',
      },
    };
  }
  await sql`
    insert into bar_emails (bar_id, to_email, subject, body, provider_id)
    values (${id}, ${values.to}, ${values.subject}, ${values.body}, ${sent.id ?? ''})`;
  redirect(`/admin/bars/${id}?emailed=1`);
}
