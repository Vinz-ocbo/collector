import type { Card } from '@/shared/domain';
import type { MagicCard, MagicMeta } from '@/tcg/magic';

/**
 * Dev seed data — small curated set of Magic cards with placeholder images.
 *
 * Used by the "Charger un jeu de démo" button on the empty collection state.
 * Replaced by real Scryfall data once the search/scan flows are wired.
 */

function placeholderImage(name: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 680" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${color}"/>
        <stop offset="1" stop-color="#0f0f12"/>
      </linearGradient>
    </defs>
    <rect width="488" height="680" rx="20" fill="url(#g)"/>
    <rect x="20" y="20" width="448" height="640" rx="14" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
    <text x="244" y="340" text-anchor="middle" fill="white" font-size="34" font-family="system-ui" font-weight="600">${name}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function makeImages(name: string, color: string) {
  const url = placeholderImage(name, color);
  return { small: url, normal: url, large: url, png: url };
}

const colorHex: Record<string, string> = {
  W: '#fffbeb',
  U: '#3b82f6',
  B: '#1f2937',
  R: '#dc2626',
  G: '#16a34a',
  C: '#94a3b8',
};

type SeedDef = {
  id: string;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: Card['rarity'];
  releasedAt: string;
  artist: string;
  priceEur: number;
  meta: MagicMeta;
};

const seedDefs: SeedDef[] = [
  // Red — instants & creatures
  {
    id: 'seed-lightning-bolt',
    name: 'Lightning Bolt',
    setCode: 'M10',
    setName: 'Magic 2010',
    collectorNumber: '146',
    rarity: 'common',
    releasedAt: '2009-07-17',
    artist: 'Christopher Moeller',
    priceEur: 1.5,
    meta: {
      manaCost: '{R}',
      cmc: 1,
      colors: ['R'],
      colorIdentity: ['R'],
      typeLine: 'Instant',
      oracleText: 'Lightning Bolt deals 3 damage to any target.',
      layout: 'normal',
    },
  },
  {
    id: 'seed-shock',
    name: 'Shock',
    setCode: 'M21',
    setName: 'Core Set 2021',
    collectorNumber: '159',
    rarity: 'common',
    releasedAt: '2020-07-03',
    artist: 'Daarken',
    priceEur: 0.1,
    meta: {
      manaCost: '{R}',
      cmc: 1,
      colors: ['R'],
      colorIdentity: ['R'],
      typeLine: 'Instant',
      oracleText: 'Shock deals 2 damage to any target.',
      layout: 'normal',
    },
  },
  {
    id: 'seed-goblin-guide',
    name: 'Goblin Guide',
    setCode: 'ZEN',
    setName: 'Zendikar',
    collectorNumber: '145',
    rarity: 'rare',
    releasedAt: '2009-10-02',
    artist: 'Mark Zug',
    priceEur: 14,
    meta: {
      manaCost: '{R}',
      cmc: 1,
      colors: ['R'],
      colorIdentity: ['R'],
      typeLine: 'Creature — Goblin Scout',
      oracleText:
        "Haste\nWhenever Goblin Guide attacks, defending player reveals the top card of their library. If it's a land card, that player puts it into their hand.",
      power: '2',
      toughness: '2',
      layout: 'normal',
    },
  },

  // Blue — control staples
  {
    id: 'seed-counterspell',
    name: 'Counterspell',
    setCode: 'MMQ',
    setName: 'Mercadian Masques',
    collectorNumber: '67',
    rarity: 'common',
    releasedAt: '1999-10-04',
    artist: 'Mark Poole',
    priceEur: 2.5,
    meta: {
      manaCost: '{U}{U}',
      cmc: 2,
      colors: ['U'],
      colorIdentity: ['U'],
      typeLine: 'Instant',
      oracleText: 'Counter target spell.',
      layout: 'normal',
    },
  },
  {
    id: 'seed-brainstorm',
    name: 'Brainstorm',
    setCode: 'ICE',
    setName: 'Ice Age',
    collectorNumber: '66',
    rarity: 'common',
    releasedAt: '1995-06-03',
    artist: 'Christopher Rush',
    priceEur: 3,
    meta: {
      manaCost: '{U}',
      cmc: 1,
      colors: ['U'],
      colorIdentity: ['U'],
      typeLine: 'Instant',
      oracleText:
        'Draw three cards, then put two cards from your hand on top of your library in any order.',
      layout: 'normal',
    },
  },
  {
    id: 'seed-force-of-will',
    name: 'Force of Will',
    setCode: 'ALL',
    setName: 'Alliances',
    collectorNumber: '42',
    rarity: 'mythic',
    releasedAt: '1996-06-10',
    artist: 'Terese Nielsen',
    priceEur: 80,
    meta: {
      manaCost: '{3}{U}{U}',
      cmc: 5,
      colors: ['U'],
      colorIdentity: ['U'],
      typeLine: 'Instant',
      oracleText:
        "You may pay 1 life and exile a blue card from your hand rather than pay this spell's mana cost.\nCounter target spell.",
      layout: 'normal',
    },
  },

  // White
  {
    id: 'seed-swords-to-plowshares',
    name: 'Swords to Plowshares',
    setCode: 'LEA',
    setName: 'Limited Edition Alpha',
    collectorNumber: '21',
    rarity: 'uncommon',
    releasedAt: '1993-08-05',
    artist: 'Jeff A. Menges',
    priceEur: 28,
    meta: {
      manaCost: '{W}',
      cmc: 1,
      colors: ['W'],
      colorIdentity: ['W'],
      typeLine: 'Instant',
      oracleText: 'Exile target creature. Its controller gains life equal to its power.',
      layout: 'normal',
    },
  },
  {
    id: 'seed-path-to-exile',
    name: 'Path to Exile',
    setCode: 'CON',
    setName: 'Conflux',
    collectorNumber: '15',
    rarity: 'uncommon',
    releasedAt: '2009-02-06',
    artist: 'Todd Lockwood',
    priceEur: 4,
    meta: {
      manaCost: '{W}',
      cmc: 1,
      colors: ['W'],
      colorIdentity: ['W'],
      typeLine: 'Instant',
      oracleText:
        'Exile target creature. Its controller may search their library for a basic land card, put that card onto the battlefield tapped, then shuffle.',
      layout: 'normal',
    },
  },

  // Black
  {
    id: 'seed-dark-ritual',
    name: 'Dark Ritual',
    setCode: 'ICE',
    setName: 'Ice Age',
    collectorNumber: '120',
    rarity: 'common',
    releasedAt: '1995-06-03',
    artist: 'Justin Hampton',
    priceEur: 1.2,
    meta: {
      manaCost: '{B}',
      cmc: 1,
      colors: ['B'],
      colorIdentity: ['B'],
      typeLine: 'Instant',
      oracleText: 'Add {B}{B}{B}.',
      layout: 'normal',
    },
  },
  {
    id: 'seed-thoughtseize',
    name: 'Thoughtseize',
    setCode: 'THS',
    setName: 'Theros',
    collectorNumber: '107',
    rarity: 'rare',
    releasedAt: '2013-09-27',
    artist: 'Aleksi Briclot',
    priceEur: 18,
    meta: {
      manaCost: '{B}',
      cmc: 1,
      colors: ['B'],
      colorIdentity: ['B'],
      typeLine: 'Sorcery',
      oracleText:
        'Target player reveals their hand. You choose a nonland card from it. That player discards that card. You lose 2 life.',
      layout: 'normal',
    },
  },

  // Green
  {
    id: 'seed-llanowar-elves',
    name: 'Llanowar Elves',
    setCode: 'M19',
    setName: 'Core Set 2019',
    collectorNumber: '314',
    rarity: 'common',
    releasedAt: '2018-07-13',
    artist: 'Chris Rahn',
    priceEur: 0.4,
    meta: {
      manaCost: '{G}',
      cmc: 1,
      colors: ['G'],
      colorIdentity: ['G'],
      typeLine: 'Creature — Elf Druid',
      oracleText: '{T}: Add {G}.',
      power: '1',
      toughness: '1',
      layout: 'normal',
    },
  },
  {
    id: 'seed-tarmogoyf',
    name: 'Tarmogoyf',
    setCode: 'FUT',
    setName: 'Future Sight',
    collectorNumber: '153',
    rarity: 'mythic',
    releasedAt: '2007-05-04',
    artist: 'Justin Murray',
    priceEur: 40,
    meta: {
      manaCost: '{1}{G}',
      cmc: 2,
      colors: ['G'],
      colorIdentity: ['G'],
      typeLine: 'Creature — Lhurgoyf',
      oracleText:
        "Tarmogoyf's power is equal to the number of card types among cards in all graveyards and its toughness is equal to that number plus 1.",
      power: '*',
      toughness: '1+*',
      layout: 'normal',
    },
  },

  // Multicolor
  {
    id: 'seed-lightning-helix',
    name: 'Lightning Helix',
    setCode: 'RAV',
    setName: 'Ravnica: City of Guilds',
    collectorNumber: '227',
    rarity: 'uncommon',
    releasedAt: '2005-10-07',
    artist: 'Greg Staples',
    priceEur: 3,
    meta: {
      manaCost: '{R}{W}',
      cmc: 2,
      colors: ['R', 'W'],
      colorIdentity: ['R', 'W'],
      typeLine: 'Instant',
      oracleText: 'Lightning Helix deals 3 damage to any target and you gain 3 life.',
      layout: 'normal',
    },
  },

  // Colorless / artifacts
  {
    id: 'seed-sol-ring',
    name: 'Sol Ring',
    setCode: 'CMR',
    setName: 'Commander Legends',
    collectorNumber: '514',
    rarity: 'uncommon',
    releasedAt: '2020-11-20',
    artist: 'Mark Tedin',
    priceEur: 1.5,
    meta: {
      cmc: 1,
      colors: [],
      colorIdentity: [],
      typeLine: 'Artifact',
      oracleText: '{T}: Add {C}{C}.',
      layout: 'normal',
    },
  },
  {
    id: 'seed-black-lotus',
    name: 'Black Lotus',
    setCode: 'LEA',
    setName: 'Limited Edition Alpha',
    collectorNumber: '232',
    rarity: 'rare',
    releasedAt: '1993-08-05',
    artist: 'Christopher Rush',
    priceEur: 12500,
    meta: {
      cmc: 0,
      colors: [],
      colorIdentity: [],
      typeLine: 'Artifact',
      oracleText: '{T}, Sacrifice Black Lotus: Add three mana of any one color.',
      layout: 'normal',
    },
  },

  // Lands (basics)
  {
    id: 'seed-island',
    name: 'Island',
    setCode: 'M21',
    setName: 'Core Set 2021',
    collectorNumber: '309',
    rarity: 'common',
    releasedAt: '2020-07-03',
    artist: 'Sam Burley',
    priceEur: 0.05,
    meta: {
      cmc: 0,
      colors: [],
      colorIdentity: ['U'],
      typeLine: 'Basic Land — Island',
      oracleText: '({T}: Add {U}.)',
      layout: 'normal',
    },
  },
  {
    id: 'seed-forest',
    name: 'Forest',
    setCode: 'M21',
    setName: 'Core Set 2021',
    collectorNumber: '320',
    rarity: 'common',
    releasedAt: '2020-07-03',
    artist: 'Alayna Danner',
    priceEur: 0.05,
    meta: {
      cmc: 0,
      colors: [],
      colorIdentity: ['G'],
      typeLine: 'Basic Land — Forest',
      oracleText: '({T}: Add {G}.)',
      layout: 'normal',
    },
  },
  {
    id: 'seed-mountain',
    name: 'Mountain',
    setCode: 'M21',
    setName: 'Core Set 2021',
    collectorNumber: '316',
    rarity: 'common',
    releasedAt: '2020-07-03',
    artist: 'Sam Burley',
    priceEur: 0.05,
    meta: {
      cmc: 0,
      colors: [],
      colorIdentity: ['R'],
      typeLine: 'Basic Land — Mountain',
      oracleText: '({T}: Add {R}.)',
      layout: 'normal',
    },
  },

  // Planeswalker
  {
    id: 'seed-jace-mind-sculptor',
    name: 'Jace, the Mind Sculptor',
    setCode: 'WWK',
    setName: 'Worldwake',
    collectorNumber: '31',
    rarity: 'mythic',
    releasedAt: '2010-02-05',
    artist: 'Jason Chan',
    priceEur: 70,
    meta: {
      manaCost: '{2}{U}{U}',
      cmc: 4,
      colors: ['U'],
      colorIdentity: ['U'],
      typeLine: 'Legendary Planeswalker — Jace',
      oracleText:
        "+2: Look at the top card of target player's library. You may put that card on the bottom of that player's library.\n0: Draw three cards, then put two cards from your hand on top of your library in any order.\n−1: Return target creature to its owner's hand.\n−12: Exile all cards from target player's library, then that player shuffles their hand into their library.",
      loyalty: '3',
      layout: 'normal',
    },
  },
];

function dominantColor(meta: MagicMeta): string {
  if (meta.colors.length === 0) {
    if (meta.typeLine.toLowerCase().includes('land')) return colorHex.C as string;
    return colorHex.C as string;
  }
  if (meta.colors.length > 1) return '#a855f7'; // multicolor → purple-ish
  return colorHex[meta.colors[0] as string] ?? colorHex.C!;
}

export function buildSeedCards(): MagicCard[] {
  return seedDefs.map((def) => ({
    id: def.id,
    game: 'magic',
    name: def.name,
    setCode: def.setCode,
    setName: def.setName,
    collectorNumber: def.collectorNumber,
    rarity: def.rarity,
    language: 'en',
    imageUris: makeImages(def.name, dominantColor(def.meta)),
    artist: def.artist,
    releasedAt: def.releasedAt,
    prices: { eur: def.priceEur, updatedAt: new Date().toISOString() },
    meta: def.meta,
  }));
}
