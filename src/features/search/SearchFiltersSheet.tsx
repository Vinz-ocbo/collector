import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet, Button, Chip, Input, Skeleton, Switch } from '@/shared/ui';
import type { Card } from '@/shared/domain';
import { useSets } from './hooks';
import type { SearchFilter } from './types';

const COLOR_CODES = ['W', 'U', 'B', 'R', 'G', 'C'] as const;
const RARITY_CODES: Card['rarity'][] = ['common', 'uncommon', 'rare', 'mythic'];

const SET_PICKER_MAX = 30;

export type SearchFiltersSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: SearchFilter;
  onApply: (filter: SearchFilter) => void;
};

export function SearchFiltersSheet({
  open,
  onOpenChange,
  filter,
  onApply,
}: SearchFiltersSheetProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<SearchFilter>(filter);
  const [setSearch, setSetSearch] = useState('');
  const sets = useSets();

  useEffect(() => {
    if (open) {
      setDraft(filter);
      setSetSearch('');
    }
  }, [open, filter]);

  function toggle<T extends string>(list: T[] | undefined, value: T): T[] {
    const arr = list ?? [];
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  // Set picker: filter the catalog list by name OR code, cap to SET_PICKER_MAX.
  // The selected sets are always rendered as chips above the search input,
  // even when filtered out by the search query.
  const selectedSetCodes = useMemo(() => new Set(draft.setCodes ?? []), [draft.setCodes]);
  const filteredSets = useMemo(() => {
    if (!sets.data) return [];
    const q = setSearch.trim().toLowerCase();
    const matches = q
      ? sets.data.filter(
          (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
        )
      : sets.data;
    return matches.slice(0, SET_PICKER_MAX);
  }, [sets.data, setSearch]);

  const selectedSets = useMemo(() => {
    if (!sets.data) return [];
    return sets.data.filter((s) => selectedSetCodes.has(s.code));
  }, [sets.data, selectedSetCodes]);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('search.filters.title')}>
      <div className="flex flex-col gap-5">
        <Section title={t('search.filters.color')}>
          <div className="flex flex-wrap gap-2">
            {COLOR_CODES.map((code) => (
              <Chip
                key={code}
                size="sm"
                active={draft.colors?.includes(code) ?? false}
                onClick={() => setDraft((d) => ({ ...d, colors: toggle(d.colors, code) }))}
              >
                {t(`stats.colors.${code}`)}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title={t('search.filters.rarity')}>
          <div className="flex flex-wrap gap-2">
            {RARITY_CODES.map((code) => (
              <Chip
                key={code}
                size="sm"
                active={draft.rarities?.includes(code) ?? false}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    rarities: toggle<Card['rarity']>(d.rarities, code),
                  }))
                }
              >
                {t(`stats.rarities.${code}`)}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title={t('search.filters.set')}>
          {selectedSets.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedSets.map((s) => (
                <Chip
                  key={s.code}
                  size="sm"
                  active
                  onRemove={() =>
                    setDraft((d) => ({ ...d, setCodes: toggle(d.setCodes, s.code) }))
                  }
                  removeLabel={t('search.filters.removeChip', { label: s.name })}
                >
                  {s.name}
                </Chip>
              ))}
            </div>
          ) : null}

          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={setSearch}
              onChange={(event) => setSetSearch(event.target.value)}
              placeholder={t('search.filters.setSearchPlaceholder')}
              aria-label={t('search.filters.setSearchPlaceholder')}
              className="pl-9"
            />
          </div>

          <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-border">
            {sets.isPending ? (
              <ul className="flex flex-col">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <li key={idx} className="border-b border-border/60 px-3 py-2 last:border-b-0">
                    <Skeleton className="h-3 w-2/3" />
                  </li>
                ))}
              </ul>
            ) : filteredSets.length === 0 ? (
              <p className="px-3 py-3 text-sm text-fg-muted">{t('search.filters.setEmpty')}</p>
            ) : (
              <ul className="flex flex-col">
                {filteredSets.map((s) => {
                  const checked = selectedSetCodes.has(s.code);
                  return (
                    <li key={s.code}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() =>
                          setDraft((d) => ({ ...d, setCodes: toggle(d.setCodes, s.code) }))
                        }
                        className="flex w-full items-center justify-between gap-2 border-b border-border/60 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-fg/5"
                      >
                        <span className="flex flex-col">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs uppercase text-fg-muted">{s.code}</span>
                        </span>
                        {checked ? <span aria-hidden="true">✓</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Section>

        <Section>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>{t('search.filters.hideOwned')}</span>
            <Switch
              checked={draft.hideOwned ?? false}
              onCheckedChange={(checked) =>
                setDraft((d) => ({ ...d, hideOwned: checked || undefined }))
              }
              aria-label={t('search.filters.hideOwned')}
            />
          </label>
        </Section>
      </div>

      <div className="mt-6 flex gap-2">
        <Button variant="secondary" fullWidth onClick={() => setDraft({})}>
          {t('common.reset')}
        </Button>
        <Button
          fullWidth
          onClick={() => {
            onApply(draft);
            onOpenChange(false);
          }}
        >
          {t('common.apply')}
        </Button>
      </div>
    </BottomSheet>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section>
      {title ? <h3 className="mb-2 text-sm font-semibold text-fg-muted">{title}</h3> : null}
      {children}
    </section>
  );
}
