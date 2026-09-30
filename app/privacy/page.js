export const metadata = { title: 'Privacy' };

export default function Privacy() {
  const contact = process.env.CONTACT_EMAIL;
  return (
    <div className="prose">
      <h1 className="page-title">Privacy</h1>
      <p className="lede">What we collect when you report a TV package, and what we do with it.</p>

      <h2>What we collect</h2>
      <p>
        When you send a report, we store what you entered (the bar, the packages, how you know, the date and any link or
        note), your email address, and a scrambled version of your IP address that we use only to block spam.
      </p>

      <h2>How we use your email</h2>
      <p>
        We use it to confirm the report came from a real person and, if needed, to ask about your report. We never show
        it on the site or sell it.
      </p>

      <h2>Email updates</h2>
      <p>
        We only add you to our email list if you check the box on the form. We keep a record of when you signed up and
        the wording you agreed to. Every email we send includes a way to unsubscribe.
      </p>

      <h2>Removing your information</h2>
      <p>
        To have your reports or email address removed,{' '}
        {contact ? (
          <>
            email <span className="mono">{contact}</span>.
          </>
        ) : (
          'contact the site owner.'
        )}
      </p>
    </div>
  );
}
