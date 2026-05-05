import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, CardThumbnail } from '@/shared/ui';
import { cn } from '@/shared/lib';
import type { CollectionItemWithCard } from './repository';

export type CollectionItemCardProps = {
  item: CollectionItemWithCard;
  variant: 'grid' | 'list';
};

const conditionTone: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  NM: 'success',
  LP: 'info',
  MP: 'warning',
  HP: 'warning',
  DMG: 'danger',
};

export function CollectionItemCard({ item, variant }: CollectionItemCardProps) {
  const { t, i18n } = useTranslation();
  const altLabel = t('collection.altLabel', {
    name: item.card.name,
    setName: item.card.setName,
    count: item.quantity,
  });
  const price = item.card.prices.eur;

  if (variant === 'grid') {
    return (
      <Link
        to={`/collection/items/${item.id}`}
        className="group flex flex-col gap-1 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="relative">
          <CardThumbnail card={item.card} size="full" alt={altLabel} />
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 rounded-md bg-fg/80 px-1.5 py-0.5 text-xs font-semibold text-bg-raised"
          >
            ×{item.quantity}
          </span>
          {item.foil ? (
            <span
              aria-hidden="true"
              className="absolute left-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-md bg-accent text-accent-fg"
              title={t('collection.foil')}
            >
              <Sparkles className="h-3 w-3" />
            </span>
          ) : null}
        </div>
        <div className="px-0.5">
          <p className="truncate text-sm font-medium">{item.card.name}</p>
          <p className="truncate text-xs text-fg-muted">
            {item.card.setCode} · {item.condition}
            {price !== undefined ? ` · ${formatEur(price, i18n.language)}` : ''}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/collection/items/${item.id}`}
      className={cn(
        'group flex items-center gap-3 rounded-md p-2',
        'hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      )}
    >
      <CardThumbnail card={item.card} size="sm" alt={altLabel} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium">{item.card.name}</p>
          <span className="shrink-0 text-sm font-semibold text-fg-muted">×{item.quantity}</span>
        </div>
        <p className="truncate text-xs text-fg-muted">
          {item.card.setCode} · {item.condition}
          {item.foil ? ` · ${t('collection.foil')}` : ''}
        </p>
        {price !== undefined ? (
          <Badge tone={conditionTone[item.condition] ?? 'neutral'}>
            {formatEur(price, i18n.language)}
          </Badge>
        ) : null}
      </div>
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
