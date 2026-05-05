/**
 * Curated icon set for binders. Eight choices per design spec #15. Stored as
 * the icon's identifier (e.g. "deck") on `Binder.icon`; the matching emoji or
 * label is rendered by the UI.
 */
export const BINDER_ICONS = [
  { id: 'deck', emoji: '🃏' },
  { id: 'sale', emoji: '💰' },
  { id: 'wishlist', emoji: '⭐' },
  { id: 'trade', emoji: '🤝' },
  { id: 'tournament', emoji: '🏆' },
  { id: 'collection', emoji: '📚' },
  { id: 'cube', emoji: '🎲' },
  { id: 'sealed', emoji: '📦' },
] as const;

export type BinderIconId = (typeof BINDER_ICONS)[number]['id'];

const VALID_IDS: ReadonlySet<string> = new Set(BINDER_ICONS.map((i) => i.id));

export function isBinderIconId(value: string): value is BinderIconId {
  return VALID_IDS.has(value);
}

export function binderIconEmoji(id: string): string {
  const found = BINDER_ICONS.find((icon) => icon.id === id);
  return found?.emoji ?? '📁';
}
