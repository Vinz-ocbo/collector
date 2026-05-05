import type { Card, Game } from '@/shared/domain';

/**
 * TcgProvider — interface implemented by each TCG adapter.
 * Adding a new TCG (Pokémon, Lorcana, ...) means adding a folder under `src/tcg/<game>/`
 * that implements this interface and registering it in `providers` below.
 */
export type SearchOptions = {
  query: string;
  limit?: number;
  cursor?: string;
};

export type SearchResult = {
  cards: Card[];
  nextCursor?: string;
};

export type RecognitionCandidate = {
  cardId: string;
  confidence: number;
};

export type RecognitionResult = {
  candidates: RecognitionCandidate[];
};

export type CardSet = {
  code: string;
  name: string;
  releasedAt: string;
  cardCount: number;
};

export type TcgProvider = {
  game: Game;
  searchCards(options: SearchOptions): Promise<SearchResult>;
  getCardById(id: string): Promise<Card>;
  recognizeFromImage(image: Blob): Promise<RecognitionResult>;
  getSets(): Promise<CardSet[]>;
};

import { magicProvider } from '@/tcg/magic';

export const providers: Partial<Record<Game, TcgProvider>> = {
  magic: magicProvider,
  // pokemon: pokemonProvider, // future
};

export function getProvider(game: Game): TcgProvider {
  const provider = providers[game];
  if (!provider) throw new Error(`No TCG provider registered for game: ${String(game)}`);
  return provider;
}
