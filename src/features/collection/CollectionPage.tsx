import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpDown, Library, Plus, SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  Button,
  Chip,
  EmptyState,
  FAB,
  PageHeader,
  PullToRefresh,
  Skeleton,
  useToast,
} from '@/shared/ui';
import { CollectionList, type ViewMode } from './CollectionList';
import { FiltersSheet } from './FiltersSheet';
import { SortSheet } from './SortSheet';
import { ViewModeSheet } from './ViewModeSheet';
import { BinderHeader } from './BinderHeader';
import { ItemActionSheet } from './ItemActionSheet';
import { MoveToBinderSheet } from './MoveToBinderSheet';
import {
  useAddItem,
  useCollectionItems,
  useCollectionViewPrefs,
  useDeleteItem,
  useSaveCollectionViewPrefs,
  useSeedDemoData,
} from './hooks';
import { DEFAULT_VIEW_PREFS } from './preferences';
import type { CollectionItemWithCard, ItemFilter, ItemSort } from './repository';
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
  const { t, i18n } = useTranslation();
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
  const viewPrefs = useCollectionViewPrefs();
  const saveViewPrefs = useSaveCollectionViewPrefs();
  const sort: ItemSort = viewPrefs.data?.sort ?? DEFAULT_VIEW_PREFS.sort;
  const view: ViewMode = viewPrefs.data?.view ?? DEFAULT_VIEW_PREFS.view;
  const setSort = useCallback(
    (next: ItemSort) => saveViewPrefs.mutate({ sort: next, view }),
    [saveViewPrefs, view],
  );
  const setView = useCallback(
    (next: ViewMode) => saveViewPrefs.mutate({ sort, view: next }),
    [saveViewPrefs, sort],
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [menuItem, setMenuItem] = useState<CollectionItemWithCard | null>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<CollectionItemWithCard | null>(null);
  const [moveTarget, setMoveTarget] = useState<CollectionItemWithCard | null>(null);
  const navigate = useNavigate();

  const { data: items, isPending, isError } = useCollectionItems(filter, sort);
  const seed = useSeedDemoData();
  const addItem = useAddItem();
  const deleteItem = useDeleteItem();
  const { show } = useToast();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    // Invalidate Collection (local Dexie reads, cheap) and the catalog
    // queries that may have stale prices. The user's mutations have already
    // been committed locally, so this is mostly a "pull the latest cache"
    // gesture; price refresh from Scryfall will land here when we add it.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['collection'] }),
      queryClient.invalidateQueries({ queryKey: ['search'] }),
    ]);
  }, [queryClient]);

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

  const handleEdit = (target: CollectionItemWithCard) => {
    setMenuItem(null);
    navigate(`/collection/items/${target.id}/edit`);
  };

  const handleDuplicate = async (target: CollectionItemWithCard) => {
    setMenuItem(null);
    await addItem.mutateAsync({
      // The card is already in the local Dexie cards table — no need to pass
      // it. Spread the item's add-time fields, but skip auto-generated ones.
      cardId: target.cardId,
      game: target.game,
      quantity: target.quantity,
      condition: target.condition,
      foil: target.foil,
      language: target.language,
      binderId: target.binderId,
      ...(target.pricePaid !== undefined ? { pricePaid: target.pricePaid } : {}),
      ...(target.notes !== undefined ? { notes: target.notes } : {}),
    });
    show({
      title: t('collection.itemMenu.duplicatedToast.title'),
      description: t('collection.itemMenu.duplicatedToast.description', {
        name: target.card.name,
      }),
      tone: 'success',
    });
  };

  const handleAskMove = (target: CollectionItemWithCard) => {
    setMenuItem(null);
    setMoveTarget(target);
  };

  const handleAskDelete = (target: CollectionItemWithCard) => {
    setMenuItem(null);
    setDeleteItemTarget(target);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItemTarget) return;
    const target = deleteItemTarget;
    await deleteItem.mutateAsync({ id: target.id });
    setDeleteItemTarget(null);
    show({
      title: t('collection.itemMenu.deletedToast.title'),
      description: t('collection.itemMenu.deletedToast.description', {
        name: target.card.name,
      }),
      tone: 'success',
    });
  };

  // When the deeplink targets a specific binder, swap the generic Collection
  // header for a binder-aware one (icon + name + back-to-binders + kebab
  // actions). Items not in any binder (`binderId === null`) keep the generic
  // header — that case is "Toutes mes cartes hors classeur" and doesn't need
  // a header dedicated to a single binder entity.
  const binderId = typeof filter.binderId === 'string' ? filter.binderId : null;
  const binderTotalQuantity = useMemo(
    () => (items ? items.reduce((sum, item) => sum + item.quantity, 0) : 0),
    [items],
  );
  const binderTotalValueEur = useMemo(
    () =>
      items
        ? items.reduce((sum, item) => sum + (item.card.prices.eur ?? 0) * item.quantity, 0)
        : 0,
    [items],
  );

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh} label={t('collection.pullToRefresh')}>
      {binderId ? (
        <BinderHeader
          binderId={binderId}
          itemCount={binderTotalQuantity}
          totalValueEur={binderTotalValueEur}
          locale={i18n.language}
          onAfterDelete={() => navigate('/collection/binders', { replace: true })}
        />
      ) : (
        <PageHeader
          title={
            items ? t('collection.titleWithCount', { count: items.length }) : t('collection.title')
          }
          sticky={false}
        />
      )}

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
        <CollectionList items={items} mode={view} onItemMenu={setMenuItem} />
      )}
      </PullToRefresh>

      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filter={filter}
        onApply={setFilter}
      />
      <SortSheet open={sortOpen} onOpenChange={setSortOpen} value={sort} onChange={setSort} />
      <ViewModeSheet open={viewOpen} onOpenChange={setViewOpen} value={view} onChange={setView} />

      <FAB ariaLabel={t('collection.fabAddLabel')} onClick={() => navigate('/add/manual')}>
        <Plus className="h-6 w-6" aria-hidden="true" />
      </FAB>

      <ItemActionSheet
        item={menuItem}
        onOpenChange={(open) => {
          if (!open) setMenuItem(null);
        }}
        onEdit={handleEdit}
        onDuplicate={(target) => void handleDuplicate(target)}
        onMove={handleAskMove}
        onDelete={handleAskDelete}
      />

      <MoveToBinderSheet
        item={moveTarget}
        onOpenChange={(open) => {
          if (!open) setMoveTarget(null);
        }}
      />

      <AlertDialog
        open={deleteItemTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteItemTarget(null);
        }}
        title={t('collection.itemMenu.deleteTitle')}
        description={
          deleteItemTarget
            ? t('collection.itemMenu.deleteDescription', { name: deleteItemTarget.card.name })
            : ''
        }
        confirmLabel={
          deleteItem.isPending ? t('common.loading') : t('collection.itemMenu.deleteConfirm')
        }
        destructive
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  );
}
