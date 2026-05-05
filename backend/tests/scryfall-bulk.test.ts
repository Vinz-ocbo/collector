import { describe, expect, it } from 'vitest';
import { mapScryfallCardToInsert, mapSetDtoToInsert } from '../src/services/scryfall-bulk.ts';
import type { ScryfallCard } from '../src/services/scryfall.ts';
import type { SetDto } from '../src/schemas/sets.ts';

const FIXED_NOW = new Date('2026-05-05T00:00:00Z');

const baseCard: ScryfallCard = {
  id: 'card-1',
  oracle_id: 'oracle-1',
  name: 'Lightning Bolt',
  set: 'M21',
  set_name: 'Core Set 2021',
  collector_number: '162',
  rarity: 'common',
  lang: 'en',
  image_uris: {
    small: 'https://img/s.jpg',
    normal: 'https://img/n.jpg',
    large: 'https://img/l.jpg',
    png: 'https://img/p.png',
    art_crop: 'https://img/a.jpg',
    border_crop: 'https://img/b.jpg',
  },
  artist: 'Christopher Moeller',
  released_at: '2020-07-03',
  mana_cost: '{R}',
  cmc: 1,
  colors: ['R'],
  color_identity: ['R'],
  type_line: 'Instant',
  oracle_text: 'Lightning Bolt deals 3 damage to any target.',
  layout: 'normal',
  prices: { eur: '1.42', usd: '1.59' },
};

describe('mapScryfallCardToInsert', () => {
  it('maps the happy path', () => {
    const row = mapScryfallCardToInsert(baseCard, FIXED_NOW);
    expect(row).toMatchObject({
      id: 'card-1',
      oracleId: 'oracle-1',
      game: 'magic',
      name: 'Lightning Bolt',
      setCode: 'm21',
      setName: 'Core Set 2021',
      rarity: 'common',
      language: 'en',
      imageNormal: 'https://img/n.jpg',
      artist: 'Christopher Moeller',
      releasedAt: '2020-07-03',
      priceEur: '1.42',
      priceUsd: '1.59',
      pricesUpdatedAt: FIXED_NOW,
      updatedAt: FIXED_NOW,
    });
    expect(row.meta).toMatchObject({
      manaCost: '{R}',
      cmc: 1,
      colors: ['R'],
      typeLine: 'Instant',
      layout: 'normal',
    });
  });

  it('falls back to card_faces[0].image_uris on dual-faced cards', () => {
    const dualFaced: ScryfallCard = {
      ...baseCard,
      image_uris: undefined,
      card_faces: [
        {
          image_uris: {
            small: 'face/s.jpg',
            normal: 'face/n.jpg',
            large: 'face/l.jpg',
            png: 'face/p.png',
            art_crop: 'face/a.jpg',
            border_crop: 'face/b.jpg',
          },
        },
        { image_uris: undefined },
      ],
    };
    const row = mapScryfallCardToInsert(dualFaced, FIXED_NOW);
    expect(row.imageNormal).toBe('face/n.jpg');
  });

  it('emits empty image strings when no images are provided', () => {
    const noImages: ScryfallCard = { ...baseCard, image_uris: undefined };
    const row = mapScryfallCardToInsert(noImages, FIXED_NOW);
    expect(row.imageNormal).toBe('');
    expect(row.imagePng).toBe('');
  });

  it('preserves null prices when Scryfall returns nulls', () => {
    const noPrices: ScryfallCard = {
      ...baseCard,
      prices: { eur: null, usd: null },
    };
    const row = mapScryfallCardToInsert(noPrices, FIXED_NOW);
    expect(row.priceEur).toBeNull();
    expect(row.priceUsd).toBeNull();
  });

  it('lowercases the set code', () => {
    const row = mapScryfallCardToInsert({ ...baseCard, set: 'ZNR' }, FIXED_NOW);
    expect(row.setCode).toBe('znr');
  });
});

describe('mapSetDtoToInsert', () => {
  it('maps a SetDto to the insert shape', () => {
    const set: SetDto = {
      id: 'set-1',
      game: 'magic',
      code: 'dom',
      name: 'Dominaria',
      setType: 'expansion',
      cardCount: 280,
      printedSize: 269,
      releasedAt: '2018-04-27',
      digital: false,
      iconSvgUri: 'https://svgs/dom.svg',
    };
    const row = mapSetDtoToInsert(set, FIXED_NOW);
    expect(row).toMatchObject({
      id: 'set-1',
      game: 'magic',
      code: 'dom',
      name: 'Dominaria',
      cardCount: 280,
      printedSize: 269,
      digital: false,
      block: null,
      blockCode: null,
      parentSetCode: null,
      updatedAt: FIXED_NOW,
    });
  });
});
