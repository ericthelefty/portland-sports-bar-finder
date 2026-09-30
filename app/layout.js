import Link from 'next/link';
import { Big_Shoulders, Public_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const display = Big_Shoulders({ subsets: ['latin'], weight: ['600', '800'], variable: '--font-display' });
const body = Public_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata = {
  title: {
    default: 'Portland Sports Bar Finder',
    template: '%s · Portland Sports Bar Finder',
  },
  description:
    'Find sports bars in Portland, Oregon by the TV packages they carry: NFL Sunday Ticket, NBA League Pass, NHL Center Ice, MLB Extra Innings and more.',
};

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
            <Link href="/" className="logo">
              PDX <span>Game</span> Finder
            </Link>
            <div className="nav-links">
              <Link href="/">All bars</Link>
              <Link href="/report" className="nav-cta">
                Report a TV package
              </Link>
            </div>
          </nav>
          <main>{children}</main>
          <footer className="site-footer">
            <p>
              Package listings come from bars' own websites and from fans, reviewed before they're posted. Packages change
              from season to season, so call ahead for a must-see game.
            </p>
            <p>
              <Link href="/report">Report a TV package</Link> · <Link href="/privacy">Privacy</Link>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
