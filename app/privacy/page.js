import { CONTACT_EMAIL } from '@/lib/cities';

export const metadata = { title: 'Privacy' };

export default function Privacy() {
  const contact = CONTACT_EMAIL;
  return (
    <div className="prose">
      <h1 className="page-title">Privacy</h1>
      <p className="lede">What we collect when you report a TV package, and what we do with it.</p>

      <h2>What we collect</h2>
      <p>
        When you send a report, we store what you entered: the bar, the packages, how you know, and any date, link or note.
        We don't ask for your name or email address.
      </p>
      <p>
        We also store a scrambled version of your IP address. We can't turn it back into your address. We use it only to
        limit how many reports one connection can send, to block spam.
      </p>

      <h2>Bot check</h2>
      <p>
        The report form uses Cloudflare Turnstile to check that a person, not a bot, is sending it. Cloudflare may process
        technical information from your browser to run this check, as described in{' '}
        <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener noreferrer">
          Cloudflare's Turnstile privacy addendum
        </a>
        .
      </p>

      <h2>What we publish</h2>
      <p>
        If we approve your report, the site shows the package and that it was reported by a fan (or confirmed by the bar, if
        you said you work there), with the date. We never publish your note or link.
      </p>

      {contact && (
        <>
          <h2>Questions</h2>
          <p>
            Email <a href={`mailto:${contact}`}>{contact}</a>.
          </p>
        </>
      )}
    </div>
  );
}
