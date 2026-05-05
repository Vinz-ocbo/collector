/**
 * Domain types — TCG-agnostic. No Magic-, Pokémon-, or other game-specific concepts here.
 * Game-specific metadata lives behind the discriminated `meta` union, owned by `tcg/<game>/*`.
 */

export type Game = 'magic' | 'pokemon';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus';

export type Condition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';

export type ImageUris = {
  small: string;
  normal: string;
  large: string;
  png: string;
};

export type Price = {
  eur?: number;
  usd?: number;
  updatedAt: string;
};

export type Card<Meta = unknown> = {
  id: string;
  game: Game;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: Rarity;
  language: string;
  imageUris: ImageUris;
  artist?: string;
  releasedAt: string;
  prices: Price;
  meta: Meta;
};

export type CollectionItem = {
  id: string;
  cardId: string;
  game: Game;
  quantity: number;
  condition: Condition;
  foil: boolean;
  language: string;
  binderId: string | null;
  pricePaid?: number;
  notes?: string;
  addedAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'error';
};

export type Binder = {
  id: string;
  name: string;
  description?: string;
  icon: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

/** Trading-card set / expansion. TCG-agnostic. */
export type CardSet = {
  id: string;
  game: Game;
  code: string;
  name: string;
  setType: string;
  cardCount: number;
  /** Official set size when it differs from cardCount (counts all variants). */
  printedSize?: number;
  releasedAt?: string;
  digital: boolean;
  iconSvgUri: string;
  blockCode?: string;
  block?: string;
  parentSetCode?: string;
};
