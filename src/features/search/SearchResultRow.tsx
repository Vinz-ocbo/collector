import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CardThumbnail } from '@/shared/ui';
import type { Card } from '@/shared/domain';

export type SearchResultRowProps = {
  card: Card;
  ownedCount?: number | undefined;
  /**
   * When provided, the row renders as a button that calls `onSelect(card)`
   * instead of navigating to the card detail. Used by the add-manual flow
   * to open the AddToCollectionSheet inline.
   */
  onSelect?: (card: Card) => void;
};

export function SearchResultRow({ card, ownedCount, onSelect }: SearchResultRowProps) {
  const { t, i18n } = useTranslation();
  const meta = card.meta as { typeLine?: string } | undefined;
  const price = card.prices.eur;

  const inner = (
    <>
      <CardThumbnail card={card} size="sm" />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium">{card.name}</p>
        <p className="truncate text-xs text-fg-muted">
          {card.setName} ({card.setCode}) · {card.rarity}
          {meta?.typeLine ? ` · ${meta.typeLine}` : ''}
        </p>
        {price !== undefined ? (
          <p className="mt-0.5 text-xs text-fg-muted">{formatEur(price, i18n.language)}</p>
        ) : null}
      </div>
      {ownedCount && ownedCount > 0 ? (
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success"
          aria-label={t('search.ownedAriaLabel', { count: ownedCount })}
        >
          <Check className="h-3 w-3" aria-hidden="true" />×{ownedCount}
        </span>
      ) : null}
    </>
  );

  const className =
    'group flex w-full items-center gap-3 rounded-md p-2 hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(card)} className={className}>
        {inner}
      </button>
    );
  }

  return (
    <Link to={`/search/cards/${card.id}`} className={className}>
      {inner}
    </Link>
  );
}

function formatEur(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: value < 10 ? 2 : 0,
  }).format(value);
}
