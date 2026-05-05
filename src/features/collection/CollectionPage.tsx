import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpDown, Library, SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Chip, EmptyState, PageHeader, Skeleton, useToast } from '@/shared/ui';
import { CollectionList, type ViewMode } from './CollectionList';
import { FiltersSheet } from './FiltersSheet';
import { SortSheet } from './SortSheet';
import { ViewModeSheet } from './ViewModeSheet';
import { useCollectionItems, useSeedDemoData } from './hooks';
import type { ItemFilter, ItemSort } from './repository';
import { filterFromSearchParams, searchParamsFromFilter } from './urlFilters';

const SORT_SHORT_KEYS: Record<
  ItemSort,
  | 'addedAtDescShort'
  | 'addedAtAscShort'
  | 'nameAscShort'
  | 'nameDescShort'
  | 'priceDescShort'
  | 'priceAscShort'
  | 'rarityDescShort'
> = {
  'addedAt-desc': 'addedAtDescShort',
  'addedAt-asc': 'addedAtAscShort',
  'name-asc': 'nameAscShort',
  'name-desc': 'nameDescShort',
  'price-desc': 'priceDescShort',
  'price-asc': 'priceAscShort',
  'rarity-desc': 'rarityDescShort',
};

const VIEW_KEYS: Record<ViewMode, 'list' | 'grid' | 'stack'> = {
  list: 'list',
  grid: 'grid',
  stack: 'stack',
};

type ChipDescriptor = {
  key: string;
  labelKey:
    | 'chipColor'
    | 'chipRarity'
    | 'chipCondition'
    | 'chipType'
    | 'chipSet'
    | 'foilFoil'
    | 'foilNonFoil';
  count?: number;
  clear: () => ItemFilter;
};

function activeFilterChips(filter: ItemFilter): ChipDescriptor[] {
  const chips: ChipDescriptor[] = [];
  if (filter.colors?.length) {
    chips.push({
      key: 'colors',
      labelKey: 'chipColor',
      count: filter.colors.length,
      clear: () => ({ ...filter, colors: undefined }),
    });
  }
  if (filter.rarities?.length) {
    chips.push({
      key: 'rarities',
      labelKey: 'chipRarity',
      count: filter.rarities.length,
      clear: () => ({ ...filter, rarities: undefined }),
    });
  }
  if (filter.types?.length) {
    chips.push({
      key: 'types',
      labelKey: 'chipType',
      count: filter.types.length,
      clear: () => ({ ...filter, types: undefined }),
    });
  }
  if (filter.setCodes?.length) {
    chips.push({
      key: 'setCodes',
      labelKey: 'chipSet',
      count: filter.setCodes.length,
      clear: () => ({ ...filter, setCodes: undefined }),
    });
  }
  if (filter.conditions?.length) {
    chips.push({
      key: 'conditions',
      labelKey: 'chipCondition',
      count: filter.conditions.length,
      clear: () => ({ ...filter, conditions: undefined }),
    });
  }
  if (filter.foil && filter.foil !== 'all') {
    chips.push({
      key: 'foil',
      labelKey: filter.foil === 'foil' ? 'foilFoil' : 'foilNonFoil',
      clear: () => ({ ...filter, foil: 'all' }),
    });
  }
  return chips;
}

export function CollectionPage() {
  const { t } = useTranslation();
  // URL search params are the source of truth for the filter so deeplinks
  // (e.g. from the Stats pages: `/?colors=R`) land pre-filtered. Sort and
  // view-mode stay in local state — they're personal preferences, not state
  // we want to share via copy-paste.
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = useMemo(() => filterFromSearchParams(searchParams), [searchParams]);
  const setFilter = useCallback(
    (next: ItemFilter) => {
      setSearchParams(searchParamsFromFilter(next), { replace: true });
    },
    [setSearchParams],
  );
  const [sort, setSort] = useState<ItemSort>('addedAt-desc');
  const [view, setView] = useState<ViewMode>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const { data: items, isPending, isError } = useCollectionItems(filter, sort);
  const seed = useSeedDemoData();
  const { show } = useToast();

  const activeChips = useMemo(() => activeFilterChips(filter), [filter]);

  const handleSeed = async () => {
    const result = await seed.mutateAsync();
    show({
      title: t('collection.empty.demoLoaded.title'),
      description: t('collection.empty.demoLoaded.description', {
        cards: result.cards,
        items: result.items,
      }),
      tone: 'success',
    });
  };

  return (
    <>
      <PageHeader
        title={
          items ? t('collection.titleWithCount', { count: items.length }) : t('collection.title')
        }
        sticky={false}
      />

      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setSortOpen(true)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-fg-muted hover:bg-fg/5"
        >
          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
          {t(`collection.sort.${SORT_SHORT_KEYS[sort]}`)}
        </button>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-fg-muted hover:bg-fg/5"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {t('collection.filters.label')}
        </button>
        <button
          type="button"
          onClick={() => setViewOpen(true)}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-fg-muted hover:bg-fg/5"
        >
          {t(`collection.view.${VIEW_KEYS[view]}`)}
        </button>
      </div>

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-3 pb-2">
          {activeChips.map((chip) => {
            const label = chip.count
              ? t(`collection.filters.${chip.labelKey}`, { count: chip.count })
              : t(`collection.filters.${chip.labelKey}`);
            return (
              <Chip
                key={chip.key}
                size="sm"
                active
                onClick={() => setFilter(chip.clear())}
                onRemove={() => setFilter(chip.clear())}
                removeLabel={t('collection.filters.removeChip', { label })}
              >
                {label}
              </Chip>
            );
          })}
          <button
            type="button"
            onClick={() => setFilter({})}
            className="inline-flex items-center gap-1 rounded-md px-2 text-xs text-fg-muted hover:text-fg"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            {t('collection.filters.clearAll')}
          </button>
        </div>
      ) : null}

      {isPending ? (
        <div className="grid grid-cols-2 gap-3 px-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="aspect-[5/7] w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title={t('collection.error.title')}
          description={t('collection.error.description')}
        />
      ) : items.length === 0 ? (
        activeChips.length === 0 ? (
          <EmptyState
            icon={<Library className="h-12 w-12" />}
            title={t('collection.empty.title')}
            description={t('collection.empty.description')}
            action={
              <Button onClick={() => void handleSeed()} disabled={seed.isPending}>
                {seed.isPending
                  ? t('collection.empty.loadingDemo')
                  : t('collection.empty.loadDemo')}
              </Button>
            }
          />
        ) : (
          <EmptyState
            title={t('collection.emptyFiltered.title')}
            description={t('collection.emptyFiltered.description')}
            action={
              <Button variant="secondary" onClick={() => setFilter({})}>
                {t('collection.emptyFiltered.reset')}
              </Button>
            }
          />
        )
      ) : (
        <CollectionList items={items} mode={view} />
      )}

      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filter={filter}
        onApply={setFilter}
      />
      <SortSheet open={sortOpen} onOpenChange={setSortOpen} value={sort} onChange={setSort} />
      <ViewModeSheet open={viewOpen} onOpenChange={setViewOpen} value={view} onChange={setView} />
    </>
  );
}
