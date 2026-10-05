import Link from 'next/link';
import { Big_Shoulders, Public_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { BRAND, TAGLINE, DEFAULT_CITY, cityPath } from '@/lib/cities';

const display = Big_Shoulders({ subsets: ['latin'], weight: ['600', '800'], variable: '--font-display' });
const body = Public_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://oombar.com'),
  title: {
    default: `${BRAND} · ${TAGLINE}`,
    template: `%s · ${BRAND}`,
  },
  description:
    'Find sports bars showing out-of-market games: NFL Sunday Ticket, NBA League Pass, NHL Center Ice, MLB Extra Innings and more.',
  applicationName: BRAND,
  openGraph: { siteName: BRAND, type: 'website' },
};

const home = cityPath(DEFAULT_CITY);

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <div className="wrap">
          <nav className="site-nav" aria-label="Main">
            <Link href="/" className="logo" aria-label={`${BRAND} home`}>
              Oom<span>bar</span>
            </Link>
            <div className="nav-links">
              <Link href={home}>Portland</Link>
              <Link href={cityPath(DEFAULT_CITY, '/report')} className="nav-cta">
                Report a TV package
              </Link>
            </div>
          </nav>
          <main>{children}</main>
          <footer className="site-footer">
            <p className="footer-brand">
              <b>{BRAND}</b> · {TAGLINE}
            </p>
            <p>
              Package listings come from bars' own websites and from fans, reviewed before they're posted. Packages change
              from season to season, so call ahead for a must-see game.
            </p>
            <p>
              <Link href={cityPath(DEFAULT_CITY, '/report')}>Report a TV package</Link> · <Link href="/privacy">Privacy</Link>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
