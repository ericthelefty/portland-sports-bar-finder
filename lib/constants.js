// Shared lists used by the pages, the report form and the database.

export const PACKAGES = [
  { key: 'nfl_sunday_ticket', label: 'NFL Sunday Ticket' },
  { key: 'nfl_redzone', label: 'NFL RedZone' },
  { key: 'nba_league_pass', label: 'NBA League Pass' },
  { key: 'nhl_center_ice', label: 'NHL Center Ice' },
  { key: 'mlb_extra_innings', label: 'MLB Extra Innings' },
  { key: 'mls_season_pass', label: 'MLS Season Pass' },
];
export const PACKAGE_KEYS = PACKAGES.map((p) => p.key);
export const packageLabel = (key) => PACKAGES.find((p) => p.key === key)?.label ?? key;

export const AREAS = ['N', 'NE', 'SE', 'SW', 'NW'];

// How the person reporting knows about the package.
export const RELATIONS = [
  { key: 'saw', label: 'I saw it on the TVs' },
  { key: 'staff', label: 'Staff told me' },
  { key: 'owner', label: 'I own or work at this bar' },
  { key: 'post', label: "The bar's website or social media says so" },
];
export const relationLabel = (key) => RELATIONS.find((r) => r.key === key)?.label ?? key;

// Where a package listing came from, as shown to visitors.
export const SOURCE_LABELS = {
  bar_website: "Listed on the bar's website",
  owner: 'Confirmed by the bar',
  fan: 'Reported by a fan',
  admin: 'Added by the site',
};

// Exact wording of the email-list checkbox. It is stored with each signup as a consent record.
export const CONSENT_TEXT =
  'Send me occasional updates about Portland sports bars. I can unsubscribe anytime.';

// A listing older than this is flagged as possibly out of date.
export const STALE_AFTER_DAYS = 270;
