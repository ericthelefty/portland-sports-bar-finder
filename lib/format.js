import { STALE_AFTER_DAYS } from '@/lib/constants';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

// "2026-09-27" -> "Sept 27, 2026"
export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function isStale(iso, now = new Date()) {
  if (!iso) return false;
  const then = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return (now - then) / 86400000 > STALE_AFTER_DAYS;
}

// Drops the city, state and ZIP for compact display: "225 SW Broadway #100".
export function shortAddress(address) {
  return (address || '').replace(/,\s*[A-Za-z .]+,?\s+[A-Z]{2}(\s+\d{5}(-\d{4})?)?$/, '');
}

// A Google Maps search for the bar. `place` (e.g. "Portland, OR") helps when the address is missing.
export function mapsUrl(name, address, place = '') {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address || place}`)}`;
}
