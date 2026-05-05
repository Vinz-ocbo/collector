/**
 * URL search-params <-> ItemFilter serialization. Used by CollectionPage so
 * deeplinks like `/?colors=R&rarities=mythic` (built by the Stats pages) land
 * on a pre-filtered Collection.
 *
 * Lists are comma-separated. Unknown values for closed enums (rarities,
 * conditions, colors, foil) are silently dropped to keep stale URLs from
 * blowing up the page. `binderId=none` represents "no binder".
 */

import type { Card, CollectionItem } from '@/shared/domain';
import type { ItemFilter } from './repository';

const COLOR_VALUES = new Set(['W', 'U', 'B', 'R', 'G', 'C']);
const RARITY_VALUES: ReadonlySet<Card['rarity']> = new Set([
  'common',
  'uncommon',
  'rare',
  'mythic',
  'special',
  'bonus',
]);
const CONDITION_VALUES: ReadonlySet<CollectionItem['condition']> = new Set([
  'NM',
  'LP',
  'MP',
  'HP',
  'DMG',
]);
const FOIL_VALUES = new Set<NonNullable<ItemFilter['foil']>>(['all', 'foil', 'non-foil']);

function parseList(v: string | null): string[] | undefined {
  if (!v) return undefined;
  const arr = v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? arr : undefined;
}

export function filterFromSearchParams(params: URLSearchParams): ItemFilter {
  const filter: ItemFilter = {};

  const colors = parseList(params.get('colors'))?.filter((c) => COLOR_VALUES.has(c));
  if (colors?.length) filter.colors = colors;

  const rarities = parseList(params.get('rarities'))?.filter((r): r is Card['rarity'] =>
    RARITY_VALUES.has(r as Card['rarity']),
  );
  if (rarities?.length) filter.rarities = rarities;

  const conditions = parseList(params.get('conditions'))?.filter(
    (c): c is CollectionItem['condition'] => CONDITION_VALUES.has(c as CollectionItem['condition']),
  );
  if (conditions?.length) filter.conditions = conditions;

  const setCodes = parseList(params.get('setCodes'));
  if (setCodes?.length) filter.setCodes = setCodes;

  const types = parseList(params.get('types'));
  if (types?.length) filter.types = types;

  const foil = params.get('foil');
  if (foil && FOIL_VALUES.has(foil as NonNullable<ItemFilter['foil']>)) {
    filter.foil = foil as ItemFilter['foil'];
  }

  const binderId = params.get('binderId');
  if (binderId === 'none') filter.binderId = null;
  else if (binderId) filter.binderId = binderId;

  return filter;
}

export function searchParamsFromFilter(filter: ItemFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.colors?.length) params.set('colors', filter.colors.join(','));
  if (filter.rarities?.length) params.set('rarities', filter.rarities.join(','));
  if (filter.conditions?.length) params.set('conditions', filter.conditions.join(','));
  if (filter.setCodes?.length) params.set('setCodes', filter.setCodes.join(','));
  if (filter.types?.length) params.set('types', filter.types.join(','));
  if (filter.foil && filter.foil !== 'all') params.set('foil', filter.foil);
  if (filter.binderId === null) params.set('binderId', 'none');
  else if (filter.binderId) params.set('binderId', filter.binderId);
  return params;
}
