import 'server-only';
import { packageLabel, relationLabel } from '@/lib/constants';
import { getCity, findArea } from '@/lib/cities';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Emails the site owner about a new report. Needs RESEND_API_KEY in Vercel; does nothing without it.
// Never throws: a mail problem must not affect the report, which is already saved.
export async function emailNewReport(r) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const city = getCity(r.city);
  const site = (process.env.SITE_URL || 'https://oombar.com').replace(/\/$/, '');
  const changes = [
    ...r.has.map((k) => `+ ${packageLabel(k)}`),
    ...r.not.map((k) => `− ${packageLabel(k)}`),
    ...(r.team ? [`Team: ${r.team}`] : []),
  ];
  const where = r.barName || `New bar: ${r.newBarName}`;
  const subject = `${r.barName ? 'Report' : 'New bar'}: ${r.barName || r.newBarName} (${city?.slug ?? r.city})${
    changes.length ? ` · ${changes.join(', ')}` : ''
  }`.slice(0, 180);

  const rows = [
    ['Bar', where],
    ['City', city?.full ?? r.city],
    ...(r.barName ? [] : [['Address', r.newBarAddress], ['Area', findArea(r.city, r.newBarArea)?.label || 'Not given']]),
    ['Has', r.has.map(packageLabel).join(', ') || '—'],
    ["Doesn't have", r.not.map(packageLabel).join(', ') || '—'],
    ...(r.otherPackage ? [['Other package', r.otherPackage]] : []),
    ...(r.team ? [['Team bar for', r.team]] : []),
    ['How they know', relationLabel(r.relation)],
    ...(r.seenOn ? [['Seen on', r.seenOn]] : []),
    ...(r.link ? [['Link', r.link]] : []),
    ...(r.note ? [['Note', r.note]] : []),
  ];
  const reviewUrl = `${site}/admin#report-${r.id}`;
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nReview it: ${reviewUrl}`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#14201a">
<h2 style="margin:0 0 12px">${esc(r.barName ? 'New report' : 'New bar reported')}</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#5e6b63;vertical-align:top">${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join('')}</table>
<p style="margin:20px 0"><a href="${esc(reviewUrl)}" style="background:#1e6b48;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600">Review it</a></p>
<p style="color:#5e6b63;font-size:13px">Sent by Oombar when someone submits a report.</p></div>`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(process.env.RESEND_API_URL || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Oombar <${process.env.REPORT_EMAIL_FROM || 'reports@oombar.com'}>`,
        to: [process.env.REPORT_EMAIL_TO || 'info@oombar.com'],
        subject,
        text,
        html,
      }),
      signal: controller.signal,
    });
    if (!res.ok) console.error('Report email failed:', res.status, (await res.text()).slice(0, 300));
  } catch (err) {
    console.error('Report email failed:', err?.message || err);
  } finally {
    clearTimeout(timer);
  }
}
