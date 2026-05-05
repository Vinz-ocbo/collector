import { describe, expect, it } from 'vitest';
import { rowToDto } from '../src/services/cards-repository.ts';
import type { CardRow } from '../src/db/schema.ts';

const baseRow: CardRow = {
  id: 'card-1',
  oracleId: 'oracle-1',
  game: 'magic',
  name: 'Lightning Bolt',
  setCode: 'm21',
  setName: 'Core Set 2021',
  collectorNumber: '162',
  rarity: 'common',
  language: 'en',
  imageSmall: 'https://img/s.jpg',
  imageNormal: 'https://img/n.jpg',
  imageLarge: 'https://img/l.jpg',
  imagePng: 'https://img/p.png',
  artist: 'Christopher Moeller',
  releasedAt: '2020-07-03',
  priceEur: '1.42',
  priceUsd: '1.59',
  pricesUpdatedAt: new Date('2026-01-01T00:00:00Z'),
  meta: {
    manaCost: '{R}',
    cmc: 1,
    colors: ['R'],
    colorIdentity: ['R'],
    typeLine: 'Instant',
    oracleText: 'Lightning Bolt deals 3 damage to any target.',
    layout: 'normal',
  },
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('rowToDto', () => {
  it('maps the happy path with uppercase setCode', () => {
    const dto = rowToDto(baseRow);
    expect(dto).toMatchObject({
      id: 'card-1',
      game: 'magic',
      name: 'Lightning Bolt',
      setCode: 'M21',
      setName: 'Core Set 2021',
      rarity: 'common',
      language: 'en',
      imageUris: { normal: 'https://img/n.jpg' },
      artist: 'Christopher Moeller',
      releasedAt: '2020-07-03',
    });
    expect(dto.prices.eur).toBe(1.42);
    expect(dto.prices.usd).toBe(1.59);
    expect(dto.prices.updatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('omits optional price fields when null', () => {
    const dto = rowToDto({ ...baseRow, priceEur: null, priceUsd: null });
    expect(dto.prices.eur).toBeUndefined();
    expect(dto.prices.usd).toBeUndefined();
  });

  it('omits artist when null', () => {
    const dto = rowToDto({ ...baseRow, artist: null });
    expect(dto.artist).toBeUndefined();
  });

  it('omits optional meta fields when undefined in storage', () => {
    const dto = rowToDto({
      ...baseRow,
      meta: {
        cmc: 0,
        colors: [],
        colorIdentity: [],
        typeLine: 'Land',
        layout: 'normal',
      },
    });
    expect(dto.meta).toEqual({
      cmc: 0,
      colors: [],
      colorIdentity: [],
      typeLine: 'Land',
      layout: 'normal',
    });
  });
});
