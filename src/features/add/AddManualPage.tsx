import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search as SearchIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Input, PageHeader, Skeleton, Switch, useToast } from '@/shared/ui';
import { useOwnedCounts } from '@/features/collection';
import { AddToCollectionSheet, SearchResultRow, useSearchCards } from '@/features/search';
import type { Card } from '@/shared/domain';

export function AddManualPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Card | null>(null);
  // Series mode: when on, after each successful add we stay on this page so
  // the user can chain entries. Off by default — single-shot is the common
  // case. Counter only shown when seriesMode is on AND at least one card has
  // been added in this page session.
  const [seriesMode, setSeriesMode] = useState(false);
  const [seriesCount, setSeriesCount] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus per design spec #37: "Focus auto sur le champ à l'arrivée."
  // Mobile keyboards open on focus, which is the desired behaviour here.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = useSearchCards({ query });
  const ownedCounts = useOwnedCounts();
  const trimmed = query.trim();
  const showSuggestions = trimmed.length < 2;

  function handleAdded() {
    if (seriesMode) {
      setSeriesCount((c) => c + 1);
      setQuery('');
      // Defer the focus call so it lands after Vaul's close transition; if
      // we focus while the sheet is still tearing down, Radix's focus-trap
      // wrestles control back.
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    navigate('/');
  }

  function handleFinish() {
    if (seriesCount > 0) {
      show({
        title: t('add.manual.series.finishToastTitle'),
        description: t('add.manual.series.finishToastDescription', { count: seriesCount }),
        tone: 'success',
      });
    }
    navigate('/');
  }

  const showCounter = seriesMode && seriesCount > 0;

  return (
    <>
      <PageHeader title={t('add.manual.title')} onBack={() => navigate(-1)} sticky={false} />

      <form
        onSubmit={(event) => event.preventDefault()}
        role="search"
        className="px-3 py-2"
        aria-label={t('add.manual.formLabel')}
      >
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('add.manual.placeholder')}
            aria-label={t('add.manual.ariaLabel')}
            className="pl-9 pr-10"
          />
          {query.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label={t('search.clear')}
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-fg-muted hover:bg-fg/5"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </form>

      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={seriesMode}
            onCheckedChange={setSeriesMode}
            aria-label={t('add.manual.series.toggleLabel')}
          />
          <span>{t('add.manual.series.toggleLabel')}</span>
        </label>
        {showCounter ? (
          <span
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success"
          >
            <Check className="h-3 w-3" aria-hidden="true" />
            {t('add.manual.series.counter', { count: seriesCount })}
          </span>
        ) : null}
      </div>

      {showSuggestions ? (
        <EmptyState
          icon={<SearchIcon className="h-10 w-10" />}
          title={t('add.manual.promptTitle')}
          description={t('add.manual.promptDescription')}
        />
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
          description={t('search.noResultsDescription', { query: trimmed })}
        />
      ) : (
        <>
          <p className="px-3 text-xs text-fg-muted">
            {t('search.results', { count: search.data.total })}
          </p>
          <ul className="flex flex-col divide-y divide-border">
            {search.data.cards.map((card) => (
              <li key={card.id}>
                <SearchResultRow
                  card={card}
                  ownedCount={ownedCounts.data?.get(card.id)}
                  onSelect={(c) => setSelected(c)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {showCounter ? (
        <div className="sticky bottom-0 z-10 mt-4 border-t border-border bg-bg/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
          <Button fullWidth onClick={handleFinish}>
            {t('add.manual.series.finish', { count: seriesCount })}
          </Button>
        </div>
      ) : null}

      {selected ? (
        <AddToCollectionSheet
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
          card={selected}
          onAdded={handleAdded}
        />
      ) : null}
    </>
  );
}
