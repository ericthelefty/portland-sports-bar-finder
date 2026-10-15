// Cities the site covers. Each one lives at its own path, e.g. oombar.com/pdx and oombar.com/slc.
export const BRAND = 'Oombar';
export const TAGLINE = 'Out of market, not out of reach.';
// Where people can write with questions. Set CONTACT_EMAIL in Vercel to change it.
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'info@oombar.com';

// Each city's parts of town. `key` is what's saved with a bar, `short` fits the small badge on a bar card,
// and `label` reads naturally in a sentence ("No bar in NE Portland…", "No bar in Sugar House…").
const quadrants = (city) =>
  ['N', 'NE', 'SE', 'SW', 'NW'].map((k) => ({ key: k, short: k, label: `${k} ${city}` }));

export const CITIES = {
  pdx: {
    slug: 'pdx',
    name: 'Portland',
    state: 'OR',
    full: 'Portland, Oregon',
    areas: quadrants('Portland'),
    examples: { bar: 'Spirit of 77', address: '1234 SE Division St, 97202' },
  },
  slc: {
    slug: 'slc',
    name: 'Salt Lake City',
    state: 'UT',
    full: 'Salt Lake City, Utah',
    examples: { bar: 'The Green Pig', address: '123 S Main St, 84111' },
    areas: [
      { key: 'Downtown', short: 'DT', label: 'Downtown' },
      { key: 'Central City', short: 'CC', label: 'Central City' },
      { key: 'Ballpark', short: 'BP', label: 'Ballpark' },
      { key: 'Sugar House', short: 'SH', label: 'Sugar House' },
      { key: 'East Bench', short: 'EB', label: 'East Bench' },
    ],
  },
};
export const CITY_LIST = Object.values(CITIES);

// Where older links without a city (/bars/12, /report) send people. Those links all predate Salt Lake City.
export const DEFAULT_CITY = 'pdx';

export function getCity(slug) {
  return Object.hasOwn(CITIES, slug) ? CITIES[slug] : null;
}

export const areaKeys = (slug) => getCity(slug)?.areas.map((a) => a.key) ?? [];
export const findArea = (slug, key) => getCity(slug)?.areas.find((a) => a.key === key) ?? null;

// A path inside a city, e.g. cityPath('pdx', '/bars/12') -> '/pdx/bars/12'.
export function cityPath(slug, path = '') {
  return `/${slug}${path}`;
}
