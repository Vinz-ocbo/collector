import Dexie, { type Table } from 'dexie';
import type { Binder, Card, CollectionItem } from '@/shared/domain';

/**
 * App preferences — small key-value store for UI state that must persist
 * across sessions (eg. onboarding completion). Not for business data.
 */
export type Preference = {
  key: string;
  value: unknown;
};

export class CollectorDB extends Dexie {
  items!: Table<CollectionItem, string>;
  binders!: Table<Binder, string>;
  prefs!: Table<Preference, string>;
  cards!: Table<Card, string>;

  constructor() {
    super('tcg-collector');
    this.version(1).stores({
      items: 'id, cardId, game, binderId, addedAt, syncStatus',
      binders: 'id, &name, position',
    });
    this.version(2).stores({
      items: 'id, cardId, game, binderId, addedAt, syncStatus',
      binders: 'id, &name, position',
      prefs: 'key',
    });
    this.version(3).stores({
      items: 'id, cardId, game, binderId, addedAt, syncStatus',
      binders: 'id, &name, position',
      prefs: 'key',
      cards: 'id, game, name, setCode, rarity',
    });
  }
}

export const db = new CollectorDB();

export async function getPreference<T>(key: string): Promise<T | undefined> {
  const row = await db.prefs.get(key);
  return row?.value as T | undefined;
}

export async function setPreference<T>(key: string, value: T): Promise<void> {
  await db.prefs.put({ key, value });
}
