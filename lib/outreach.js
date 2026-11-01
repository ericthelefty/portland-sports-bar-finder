import { getCity, CONTACT_EMAIL } from '@/lib/cities';
import { PACKAGES } from '@/lib/constants';

// The starting email to a bar, asking which TV packages it carries and which teams' fans meet there.
// The site owner can edit it before sending.
export function outreachDraft(bar) {
  const city = getCity(bar.city);
  const link = `oombar.com/${bar.city}/bars/${bar.id}`;
  const subject = 'Quick question about the games you show';
  const body = `Hi ${bar.name} team,

I'm Eric, and I run Oombar (oombar.com), a free site that helps ${city?.name ?? ''} fans find bars showing out-of-market games, based on which TV packages they carry.

${bar.name} is listed here: ${link}. I'd like to make sure it's accurate. Could you tell me which of these you carry this season?

${PACKAGES.map((p) => `- ${p.label}`).join('\n')}

Also, is ${bar.name} a home bar for any particular team's fans? If so, I'll tag it so those fans can find you when they search.

A quick reply with whatever applies is plenty. There's no cost, and nothing to sign up for.

Thanks,
Eric
Oombar | ${CONTACT_EMAIL}`;
  return { subject, body: body.replace(/  +/g, ' ') };
}
