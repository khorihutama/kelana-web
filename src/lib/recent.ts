const KEY = 'hsigo.recent-searches';
const LIMIT = 6;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string').slice(0, LIMIT) : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(term: string): string[] {
  const clean = term.trim();
  if (clean.length < 2) return getRecentSearches();
  const next = [clean, ...getRecentSearches().filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, LIMIT);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}

export function clearRecentSearches(): string[] {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
  return [];
}