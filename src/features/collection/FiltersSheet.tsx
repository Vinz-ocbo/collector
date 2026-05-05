import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet, Button, Chip } from '@/shared/ui';
import type { Card, CollectionItem } from '@/shared/domain';
import type { ItemFilter } from './repository';

const COLOR_CODES = ['W', 'U', 'B', 'R', 'G', 'C'] as const;
const RARITY_CODES: Card['rarity'][] = ['common', 'uncommon', 'rare', 'mythic'];
const CONDITION_CODES: CollectionItem['condition'][] = ['NM', 'LP', 'MP', 'HP', 'DMG'];

export type FiltersSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: ItemFilter;
  onApply: (filter: ItemFilter) => void;
};

export function FiltersSheet({ open, onOpenChange, filter, onApply }: FiltersSheetProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<ItemFilter>(filter);

  useEffect(() => {
    if (open) setDraft(filter);
  }, [open, filter]);

  function toggle<T extends string>(list: T[] | undefined, value: T): T[] {
    const arr = list ?? [];
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('collection.filters.title')}>
      <div className="flex flex-col gap-5">
        <Section title={t('collection.filters.color')}>
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

        <Section title={t('collection.filters.rarity')}>
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

        <Section title={t('collection.filters.condition')}>
          <div className="flex flex-wrap gap-2">
            {CONDITION_CODES.map((code) => (
              <Chip
                key={code}
                size="sm"
                active={draft.conditions?.includes(code) ?? false}
                onClick={() => setDraft((d) => ({ ...d, conditions: toggle(d.conditions, code) }))}
              >
                {code}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title={t('collection.filters.foil')}>
          <div className="flex gap-2">
            {(['all', 'foil', 'non-foil'] as const).map((value) => (
              <Chip
                key={value}
                size="sm"
                active={(draft.foil ?? 'all') === value}
                onClick={() => setDraft((d) => ({ ...d, foil: value }))}
              >
                {value === 'all'
                  ? t('collection.filters.foilAll')
                  : value === 'foil'
                    ? t('collection.filters.foilFoil')
                    : t('collection.filters.foilNonFoil')}
              </Chip>
            ))}
          </div>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-fg-muted">{title}</h3>
      {children}
    </section>
  );
}
