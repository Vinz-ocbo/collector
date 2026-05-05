import { getPreference, setPreference } from '@/shared/db';
import type { ViewMode } from './CollectionList';
import type { ItemSort } from './repository';

const KEY = 'collection.viewPrefs';

export type CollectionViewPrefs = {
  sort: ItemSort;
  view: ViewMode;
};

export const DEFAULT_VIEW_PREFS: CollectionViewPrefs = {
  sort: 'addedAt-desc',
  view: 'grid',
};

const VALID_SORTS: ReadonlySet<ItemSort> = new Set<ItemSort>([
  'addedAt-desc',
  'addedAt-asc',
  'name-asc',
  'name-desc',
  'price-desc',
  'price-asc',
  'rarity-desc',
]);

const VALID_VIEWS: ReadonlySet<ViewMode> = new Set<ViewMode>(['list', 'grid', 'stack']);

function sanitize(raw: unknown): CollectionViewPrefs {
  if (!raw || typeof raw !== 'object') return DEFAULT_VIEW_PREFS;
  const candidate = raw as { sort?: unknown; view?: unknown };
  const sort =
    typeof candidate.sort === 'string' && VALID_SORTS.has(candidate.sort as ItemSort)
      ? (candidate.sort as ItemSort)
      : DEFAULT_VIEW_PREFS.sort;
  const view =
    typeof candidate.view === 'string' && VALID_VIEWS.has(candidate.view as ViewMode)
      ? (candidate.view as ViewMode)
      : DEFAULT_VIEW_PREFS.view;
  return { sort, view };
}

export async function getCollectionViewPrefs(): Promise<CollectionViewPrefs> {
  const raw = await getPreference<unknown>(KEY);
  return sanitize(raw);
}

export async function setCollectionViewPrefs(prefs: CollectionViewPrefs): Promise<void> {
  await setPreference(KEY, prefs);
}
