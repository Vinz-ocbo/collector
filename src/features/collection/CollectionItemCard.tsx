import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, CardThumbnail } from '@/shared/ui';
import { cn } from '@/shared/lib';
import type { CollectionItemWithCard } from './repository';

const LONG_PRESS_MS = 500;

export type CollectionItemCardProps = {
  item: CollectionItemWithCard;
  variant: 'grid' | 'list';
  /**
   * Called when the user long-presses the card OR taps the kebab `⋮` button.
   * The kebab is the keyboard-accessible fallback for the long-press gesture
   * (per design spec — `.clinerules-design` §2 keyboard parity).
   */
  onMenu?: (item: CollectionItemWithCard) => void;
};

const conditionTone: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  NM: 'success',
  LP: 'info',
  MP: 'warning',
  HP: 'warning',
  DMG: 'danger',
};

/**
 * Detects a 500 ms press without movement and fires `onLongPress`. Sets a
 * "suppress next click" flag the consumer can read on click to cancel the
 * navigation that would otherwise follow the gesture.
 *
 * Cancels on pointer move beyond a few pixels — without this any tiny
 * scroll-induced jitter would still register as a long-press.
 */
function useLongPress(onLongPress: (() => void) | undefined) {
  const timerRef = useRef<number | null>(null);
  const firedRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const clear = (): void => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  };

  const onPointerDown = (event: ReactPointerEvent): void => {
    if (!onLongPress) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    firedRef.current = false;
    startRef.current = { x: event.clientX, y: event.clientY };
    timerRef.current = window.setTimeout(() => {
      firedRef.current = true;
      onLongPress();
      timerRef.current = null;
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (event: ReactPointerEvent): void => {
    if (!startRef.current || timerRef.current === null) return;
    const dx = event.clientX - startRef.current.x;
    const dy = event.clientY - startRef.current.y;
    if (dx * dx + dy * dy > 100) clear();
  };

  const handleClick = (event: React.MouseEvent): boolean => {
    if (firedRef.current) {
      event.preventDefault();
      firedRef.current = false;
      return true;
    }
    return false;
  };

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
      onContextMenu: (event: React.MouseEvent) => {
        // Suppress the native context menu that some browsers raise after a
        // long-press — our custom menu has already opened.
        if (firedRef.current) event.preventDefault();
      },
    },
    onClick: handleClick,
  };
}

export function CollectionItemCard({ item, variant, onMenu }: CollectionItemCardProps) {
  const { t, i18n } = useTranslation();
  const altLabel = t('collection.altLabel', {
    name: item.card.name,
    setName: item.card.setName,
    count: item.quantity,
  });
  const price = item.card.prices.eur;

  const longPress = useLongPress(onMenu ? () => onMenu(item) : undefined);
  const menuLabel = t('collection.itemMenu.openLabel', { name: item.card.name });

  if (variant === 'grid') {
    return (
      <div className="relative">
        <Link
          to={`/collection/items/${item.id}`}
          {...longPress.handlers}
          onClick={longPress.onClick}
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
        {onMenu ? (
          <button
            type="button"
            aria-label={menuLabel}
            onClick={() => onMenu(item)}
            className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-bg/80 text-fg-muted shadow-sm backdrop-blur hover:bg-bg-raised hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <MoreVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <Link
        to={`/collection/items/${item.id}`}
        {...longPress.handlers}
        onClick={longPress.onClick}
        className={cn(
          'group flex flex-1 items-center gap-3 rounded-md p-2',
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
      {onMenu ? (
        <button
          type="button"
          aria-label={menuLabel}
          onClick={() => onMenu(item)}
          className="ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-fg/5 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function formatEur(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: value < 10 ? 2 : 0,
  }).format(value);
}
