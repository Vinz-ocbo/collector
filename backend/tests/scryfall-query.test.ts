import { describe, expect, it } from 'vitest';
import { composeQuery, sortToScryfall } from '../src/services/scryfall.ts';

describe('composeQuery', () => {
  it('returns the user query alone when no filters are set', () => {
    expect(composeQuery({ q: 'lightning', page: 1, limit: 20 })).toBe('lightning');
  });

  it('AND-joins categories and OR-joins values within a category', () => {
    const composed = composeQuery({
      q: 'bolt',
      page: 1,
      limit: 20,
      setCodes: ['m21', 'znr'],
      rarities: ['rare', 'mythic'],
      colors: ['R'],
    });
    expect(composed).toBe('bolt (set:m21 OR set:znr) (r:rare OR r:mythic) (c:R)');
  });

  it('skips empty categories', () => {
    const composed = composeQuery({
      q: 'shock',
      page: 1,
      limit: 20,
      setCodes: [],
      rarities: ['common'],
    });
    expect(composed).toBe('shock (r:common)');
  });
});

describe('sortToScryfall', () => {
  it('defaults to name asc for relevance / undefined / name-asc', () => {
    expect(sortToScryfall(undefined)).toEqual({ order: 'name' });
    expect(sortToScryfall('relevance')).toEqual({ order: 'name' });
    expect(sortToScryfall('name-asc')).toEqual({ order: 'name' });
  });

  it('maps name-desc to dir desc', () => {
    expect(sortToScryfall('name-desc')).toEqual({ order: 'name', dir: 'desc' });
  });

  it('maps price sorts to order=eur', () => {
    expect(sortToScryfall('price-asc')).toEqual({ order: 'eur', dir: 'asc' });
    expect(sortToScryfall('price-desc')).toEqual({ order: 'eur', dir: 'desc' });
  });
});
