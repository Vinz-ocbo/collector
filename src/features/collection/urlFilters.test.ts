import { describe, expect, it } from 'vitest';
import type { ItemFilter } from './repository';
import { filterFromSearchParams, searchParamsFromFilter } from './urlFilters';

function parse(qs: string): ItemFilter {
  return filterFromSearchParams(new URLSearchParams(qs));
}

function serialize(filter: ItemFilter): string {
  return searchParamsFromFilter(filter).toString();
}

describe('filterFromSearchParams', () => {
  it('returns an empty filter for an empty query string', () => {
    expect(parse('')).toEqual({});
  });

  it('parses comma-separated lists for colors / rarities / types / setCodes', () => {
    expect(parse('colors=W,U&rarities=mythic,rare&types=Creature&setCodes=m21,znr')).toEqual({
      colors: ['W', 'U'],
      rarities: ['mythic', 'rare'],
      types: ['Creature'],
      setCodes: ['m21', 'znr'],
    });
  });

  it('drops unknown enum values silently', () => {
    expect(parse('colors=W,Z&rarities=mythic,bogus')).toEqual({
      colors: ['W'],
      rarities: ['mythic'],
    });
  });

  it('parses foil and binderId, treating "none" as null', () => {
    expect(parse('foil=foil&binderId=none')).toEqual({
      foil: 'foil',
      binderId: null,
    });
    expect(parse('binderId=abc-123')).toEqual({ binderId: 'abc-123' });
  });

  it('drops invalid foil values', () => {
    expect(parse('foil=invalid')).toEqual({});
  });

  it('ignores empty list values', () => {
    expect(parse('colors=&rarities=')).toEqual({});
  });
});

describe('searchParamsFromFilter', () => {
  it('serializes lists as comma-separated', () => {
    expect(serialize({ colors: ['W', 'U'], rarities: ['mythic'] })).toBe(
      'colors=W%2CU&rarities=mythic',
    );
  });

  it('omits the foil param when set to "all"', () => {
    expect(serialize({ foil: 'all' })).toBe('');
    expect(serialize({ foil: 'foil' })).toBe('foil=foil');
  });

  it('serializes binderId=null as "none"', () => {
    expect(serialize({ binderId: null })).toBe('binderId=none');
    expect(serialize({ binderId: 'abc' })).toBe('binderId=abc');
  });

  it('omits empty lists', () => {
    expect(serialize({ colors: [], rarities: undefined })).toBe('');
  });
});

describe('filterFromSearchParams ↔ searchParamsFromFilter roundtrip', () => {
  it('round-trips a typical Stats deeplink', () => {
    const filter: ItemFilter = { colors: ['R'] };
    expect(parse(serialize(filter))).toEqual(filter);
  });

  it('round-trips a complex multi-field filter', () => {
    const filter: ItemFilter = {
      colors: ['W', 'U'],
      rarities: ['mythic', 'rare'],
      types: ['Creature'],
      setCodes: ['m21'],
      conditions: ['NM'],
      foil: 'foil',
      binderId: null,
    };
    expect(parse(serialize(filter))).toEqual(filter);
  });
});
