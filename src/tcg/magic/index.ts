import type { CardSet, RecognitionResult, SearchOptions, SearchResult, TcgProvider } from '@/tcg';
import type { Card } from '@/shared/domain';

/**
 * Magic-specific metadata. Lives in this adapter, never leaks into shared/domain.
 */
export type MagicColor = 'W' | 'U' | 'B' | 'R' | 'G';

export type MagicMeta = {
  manaCost?: string;
  cmc: number;
  colors: MagicColor[];
  colorIdentity: MagicColor[];
  typeLine: string;
  oracleText?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  layout: string;
};

export type MagicCard = Card<MagicMeta>;

/**
 * Stub implementation. Real wiring will hit the backend Scryfall proxy.
 */
export const magicProvider: TcgProvider = {
  game: 'magic',
  searchCards(_options: SearchOptions): Promise<SearchResult> {
    return Promise.resolve({ cards: [] });
  },
  getCardById(_id: string): Promise<Card> {
    return Promise.reject(new Error('magicProvider.getCardById: not implemented'));
  },
  recognizeFromImage(_image: Blob): Promise<RecognitionResult> {
    return Promise.resolve({ candidates: [] });
  },
  getSets(): Promise<CardSet[]> {
    return Promise.resolve([]);
  },
};
