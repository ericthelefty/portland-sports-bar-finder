// Lowercase, strip accents and punctuation so "kells" finds "Kell's" and "montreal" finds "Montréal".
export const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const searchTerms = (q) => norm(q).split(' ').filter(Boolean);
