import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/shared/ui';
import { cn } from '@/shared/lib';
import type { SearchSort } from './types';

const OPTIONS: SearchSort[] = ['relevance', 'name-asc', 'name-desc', 'price-desc', 'price-asc'];

const KEYS: Record<SearchSort, 'relevance' | 'nameAsc' | 'nameDesc' | 'priceDesc' | 'priceAsc'> = {
  relevance: 'relevance',
  'name-asc': 'nameAsc',
  'name-desc': 'nameDesc',
  'price-desc': 'priceDesc',
  'price-asc': 'priceAsc',
};

export type SearchSortSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: SearchSort;
  onChange: (value: SearchSort) => void;
};

export function SearchSortSheet({ open, onOpenChange, value, onChange }: SearchSortSheetProps) {
  const { t } = useTranslation();
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('search.sort.title')}>
      <ul role="radiogroup" aria-label={t('search.sort.title')} className="flex flex-col gap-1">
        {OPTIONS.map((option) => (
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
              {t(`search.sort.${KEYS[option]}`)}
              {option === value ? <span aria-hidden="true">✓</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
