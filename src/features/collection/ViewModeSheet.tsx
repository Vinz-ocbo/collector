import { Grid2x2, LayoutList, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/shared/ui';
import { cn } from '@/shared/lib';
import type { ViewMode } from './CollectionList';

const OPTIONS: {
  value: ViewMode;
  labelKey: 'listFull' | 'grid' | 'stack';
  descKey: 'listDescription' | 'gridDescription' | 'stackDescription';
  Icon: typeof LayoutList;
}[] = [
  { value: 'list', labelKey: 'listFull', descKey: 'listDescription', Icon: LayoutList },
  { value: 'grid', labelKey: 'grid', descKey: 'gridDescription', Icon: Grid2x2 },
  { value: 'stack', labelKey: 'stack', descKey: 'stackDescription', Icon: Layers },
];

export type ViewModeSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ViewMode;
  onChange: (value: ViewMode) => void;
};

export function ViewModeSheet({ open, onOpenChange, value, onChange }: ViewModeSheetProps) {
  const { t } = useTranslation();
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('collection.view.title')}>
      <ul
        role="radiogroup"
        aria-label={t('collection.view.modeLabel')}
        className="flex flex-col gap-2"
      >
        {OPTIONS.map((option) => (
          <li key={option.value}>
            <button
              type="button"
              role="radio"
              aria-checked={option.value === value}
              onClick={() => {
                onChange(option.value);
                onOpenChange(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-md border border-border p-3 text-left',
                'hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                option.value === value && 'border-accent bg-accent/5',
              )}
            >
              <option.Icon className="h-6 w-6 text-fg-muted" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t(`collection.view.${option.labelKey}`)}</p>
                <p className="text-xs text-fg-muted">{t(`collection.view.${option.descKey}`)}</p>
              </div>
              {option.value === value ? (
                <span className="text-accent" aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
