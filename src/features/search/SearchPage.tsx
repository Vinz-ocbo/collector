import { useMemo, useState } from 'react';
import { ArrowUpDown, Search as SearchIcon, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState, Input, PageHeader, Skeleton } from '@/shared/ui';
import { useOwnedCounts } from '@/features/collection';
import {
  useClearRecentSearches,
  usePushRecentSearch,
  useRecentSearches,
  useSearchCards,
} from './hooks';
import { SearchResultRow } from './SearchResultRow';
import { SearchFiltersSheet } from './SearchFiltersSheet';
import { SearchSortSheet } from './SearchSortSheet';
import type { SearchFilter, SearchSort } from './types';

const SORT_SHORT_KEYS: Record<
  SearchSort,
  'relevanceShort' | 'nameAscShort' | 'nameDescShort' | 'priceDescShort' | 'priceAscShort'
> = {
  relevance: 'relevanceShort',
  'name-asc': 'nameAscShort',
  'name-desc': 'nameDescShort',
  'price-desc': 'priceDescShort',
  'price-asc': 'priceAscShort',
};

type ChipDescriptor = {
  key: string;
  label: string;
  ariaLabel: string;
  clear: () => SearchFilter;
};

function isFilterEmpty(filter: SearchFilter): boolean {
  return (
    !filter.colors?.length &&
    !filter.rarities?.length &&
    !filter.setCodes?.length &&
    filter.priceMin === undefined &&
    filter.priceMax === undefined &&
    !filter.hideOwned
  );
}

export function SearchPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>({});
  const [sort, setSort] = useState<SearchSort>('relevance');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const search = useSearchCards({ query, filter, sort });
  const ownedCounts = useOwnedCounts();
  const recents = useRecentSearches();
  const pushRecent = usePushRecentSearch();
  const clearRecent = useClearRecentSearches();

  const trimmed = query.trim();
  const showSuggestions = trimmed.length < 2;
  const hasFilters = !isFilterEmpty(filter);

  const activeChips = useMemo<ChipDescriptor[]>(() => {
    const chips: ChipDescriptor[] = [];
    if (filter.colors?.length) {
      const label = t('search.filters.chipColor', { count: filter.colors.length });
      chips.push({
        key: 'colors',
        label,
        ariaLabel: t('search.filters.removeChip', { label }),
        clear: () => ({ ...filter, colors: undefined }),
      });
    }
    if (filter.rarities?.length) {
      const label = t('search.filters.chipRarity', { count: filter.rarities.length });
      chips.push({
        key: 'rarities',
        label,
        ariaLabel: t('search.filters.removeChip', { label }),
        clear: () => ({ ...filter, rarities: undefined }),
      });
    }
    if (filter.setCodes?.length) {
      const label = t('search.filters.chipSet', { count: filter.setCodes.length });
      chips.push({
        key: 'setCodes',
        label,
        ariaLabel: t('search.filters.removeChip', { label }),
        clear: () => ({ ...filter, setCodes: undefined }),
      });
    }
    if (filter.priceMin !== undefined || filter.priceMax !== undefined) {
      const min = filter.priceMin;
      const max = filter.priceMax;
      const label =
        min !== undefined && max !== undefined
          ? t('search.filters.chipPriceRange', { min, max })
          : min !== undefined
            ? t('search.filters.chipPriceMin', { min })
            : t('search.filters.chipPriceMax', { max: max ?? 0 });
      chips.push({
        key: 'price',
        label,
        ariaLabel: t('search.filters.removeChip', { label }),
        clear: () => ({ ...filter, priceMin: undefined, priceMax: undefined }),
      });
    }
    if (filter.hideOwned) {
      const label = t('search.filters.chipHideOwned');
      chips.push({
        key: 'hideOwned',
        label,
        ariaLabel: t('search.filters.removeChip', { label }),
        clear: () => ({ ...filter, hideOwned: undefined }),
      });
    }
    return chips;
  }, [filter, t]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (trimmed.length >= 2) {
      pushRecent.mutate(trimmed);
    }
  };

  return (
    <>
      <PageHeader title={t('search.title')} sticky={false} />
      <form onSubmit={handleSubmit} role="search" className="px-3 py-2">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.ariaLabel')}
            className="pl-9 pr-10"
          />
          {query.length > 0 ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('search.clear')}
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-fg-muted hover:bg-fg/5"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setSortOpen(true)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-fg-muted hover:bg-fg/5"
        >
          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
          {t(`search.sort.${SORT_SHORT_KEYS[sort]}`)}
        </button>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-fg-muted hover:bg-fg/5"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {t('search.filters.label')}
        </button>
      </div>

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.clear())}
              aria-label={chip.ariaLabel}
              className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/20"
            >
              {chip.label}
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFilter({})}
            className="inline-flex items-center gap-1 rounded-md px-2 text-xs text-fg-muted hover:text-fg"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            {t('search.filters.clearAll')}
          </button>
        </div>
      ) : null}

      {showSuggestions ? (
        <div className="px-3 py-2">
          {recents.data && recents.data.length > 0 ? (
            <section>
              <header className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  {t('search.recentTitle')}
                </h2>
                <button
                  type="button"
                  onClick={() => clearRecent.mutate()}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-muted hover:bg-fg/5"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  {t('search.clearRecents')}
                </button>
              </header>
              <ul className="flex flex-col">
                {recents.data.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => setQuery(q)}
                      className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-fg/5"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <EmptyState
              icon={<SearchIcon className="h-10 w-10" />}
              title={t('search.promptTitle')}
              description={t('search.promptDescription')}
            />
          )}
        </div>
      ) : search.isPending ? (
        <ul className="flex flex-col gap-2 px-3 py-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <Skeleton className="aspect-[5/7] w-12" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </li>
          ))}
        </ul>
      ) : search.isError ? (
        <EmptyState title={t('search.errorTitle')} description={t('search.errorDescription')} />
      ) : !search.data || search.data.cards.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-10 w-10" />}
          title={t('search.noResultsTitle')}
          description={
            hasFilters
              ? t('search.noResultsFilteredDescription')
              : t('search.noResultsDescription', { query: trimmed })
          }
        />
      ) : (
        <>
          <p className="px-3 text-xs text-fg-muted">
            {t('search.results', { count: search.data.total })}
          </p>
          <ul className="flex flex-col divide-y divide-border">
            {search.data.cards.map((card) => (
              <li key={card.id}>
                <SearchResultRow card={card} ownedCount={ownedCounts.data?.get(card.id)} />
              </li>
            ))}
          </ul>
        </>
      )}

      <SearchFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filter={filter}
        onApply={setFilter}
      />
      <SearchSortSheet open={sortOpen} onOpenChange={setSortOpen} value={sort} onChange={setSort} />
    </>
  );
}

