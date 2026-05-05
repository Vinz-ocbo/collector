import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/shared/ui';
import { cn } from '@/shared/lib';
import type { ItemSort } from './repository';

const OPTION_VALUES: ItemSort[] = [
  'addedAt-desc',
  'addedAt-asc',
  'name-asc',
  'name-desc',
  'price-desc',
  'price-asc',
  'rarity-desc',
];

const SORT_KEYS: Record<
  ItemSort,
  'addedAtDesc' | 'addedAtAsc' | 'nameAsc' | 'nameDesc' | 'priceDesc' | 'priceAsc' | 'rarityDesc'
> = {
  'addedAt-desc': 'addedAtDesc',
  'addedAt-asc': 'addedAtAsc',
  'name-asc': 'nameAsc',
  'name-desc': 'nameDesc',
  'price-desc': 'priceDesc',
  'price-asc': 'priceAsc',
  'rarity-desc': 'rarityDesc',
};

export type SortSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ItemSort;
  onChange: (value: ItemSort) => void;
};

export function SortSheet({ open, onOpenChange, value, onChange }: SortSheetProps) {
  const { t } = useTranslation();
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('collection.sort.title')}>
      <ul role="radiogroup" aria-label={t('collection.sort.title')} className="flex flex-col gap-1">
        {OPTION_VALUES.map((option) => (
          <li key={option}>
            <button
              type="button"
              role="radio"
              aria-checked={option === value}
              onClick={() => {
                onChange(option);
                onOpenChange(false);
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm',
                'hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                option === value && 'bg-accent/10 font-medium text-accent',
              )}
            >
              {t(`collection.sort.${SORT_KEYS[option]}`)}
              {option === value ? <span aria-hidden="true">✓</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
