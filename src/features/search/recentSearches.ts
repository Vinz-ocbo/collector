import { getPreference, setPreference } from '@/shared/db';

const KEY = 'search.recent';
const MAX = 10;

export async function getRecentSearches(): Promise<string[]> {
  return (await getPreference<string[]>(KEY)) ?? [];
}

export async function pushRecentSearch(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;
  const existing = await getRecentSearches();
  const deduped = [trimmed, ...existing.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())];
  await setPreference(KEY, deduped.slice(0, MAX));
}

export async function clearRecentSearches(): Promise<void> {
  await setPreference(KEY, []);
}
