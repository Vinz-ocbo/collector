import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CardThumbnail } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { CollectionItemCard } from './CollectionItemCard';
import type { CollectionItemWithCard } from './repository';

export type ViewMode = 'list' | 'grid' | 'stack';

export type CollectionListProps = {
  items: CollectionItemWithCard[];
  mode: ViewMode;
  className?: string;
  /**
   * Long-press / kebab-button handler. Wired only in grid + list views;
   * stack view shows aggregated rows that don't map 1:1 to a single item.
   */
  onItemMenu?: (item: CollectionItemWithCard) => void;
};

/**
 * Renders the collection in one of 3 modes. Virtualization is intentionally
 * deferred — design rule kicks in at 100+ items; current seed dataset is
 * ~20. When real Scryfall imports land, swap the inner container for
 * `@tanstack/react-virtual`.
 */
export function CollectionList({ items, mode, className, onItemMenu }: CollectionListProps) {
  if (mode === 'stack') {
    return <StackView items={items} className={className} />;
  }

  if (mode === 'grid') {
    return (
      <ul
        className={cn(
          'grid grid-cols-2 gap-3 px-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
          className,
        )}
      >
        {items.map((item) => (
          <li key={item.id}>
            <CollectionItemCard
              item={item}
              variant="grid"
              {...(onItemMenu ? { onMenu: onItemMenu } : {})}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn('flex flex-col divide-y divide-border', className)}>
      {items.map((item) => (
        <li key={item.id}>
          <CollectionItemCard
            item={item}
            variant="list"
            {...(onItemMenu ? { onMenu: onItemMenu } : {})}
          />
        </li>
      ))}
    </ul>
  );
}

type StackEntry = {
  cardId: string;
  name: string;
  setCodes: string[];
  totalQuantity: number;
  representative: CollectionItemWithCard;
};

function StackView({
  items,
  className,
}: {
  items: CollectionItemWithCard[];
  className?: string | undefined;
}) {
  const { t } = useTranslation();
  const stacks = useMemo<StackEntry[]>(() => {
    const map = new Map<string, StackEntry>();
    for (const item of items) {
      const existing = map.get(item.card.name);
      if (existing) {
        existing.totalQuantity += item.quantity;
        if (!existing.setCodes.includes(item.card.setCode)) {
          existing.setCodes.push(item.card.setCode);
        }
      } else {
        map.set(item.card.name, {
          cardId: item.cardId,
          name: item.card.name,
          setCodes: [item.card.setCode],
          totalQuantity: item.quantity,
          representative: item,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [items]);

  return (
    <ul className={cn('flex flex-col divide-y divide-border', className)}>
      {stacks.map((stack) => (
        <li key={stack.name}>
          <Link
            to={`/collection/items/${stack.representative.id}`}
            className="flex items-center gap-3 p-2 hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <CardThumbnail card={stack.representative.card} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium">{stack.name}</p>
                <span className="shrink-0 text-sm font-semibold text-fg-muted">
                  ×{stack.totalQuantity}
                </span>
              </div>
              <p className="truncate text-xs text-fg-muted">
                {stack.setCodes.length === 1
                  ? stack.setCodes[0]
                  : t('collection.stack.versions', {
                      count: stack.setCodes.length,
                      sets: stack.setCodes.join(', '),
                    })}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
