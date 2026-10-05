// Cities the site covers. Each one lives at its own path, e.g. oombar.com/pdx.
// Adding a second city also needs a city column on the bars table so each city's bars stay separate.
export const BRAND = 'Oombar';
export const TAGLINE = 'Out of market. Not out of luck.';

export const CITIES = {
  pdx: { slug: 'pdx', name: 'Portland', state: 'OR', full: 'Portland, Oregon' },
};

// Where the home page and older links send people while there's one city.
export const DEFAULT_CITY = 'pdx';

export function getCity(slug) {
  return Object.hasOwn(CITIES, slug) ? CITIES[slug] : null;
}

// A path inside a city, e.g. cityPath('pdx', '/bars/12') -> '/pdx/bars/12'.
export function cityPath(slug, path = '') {
  return `/${slug}${path}`;
}
