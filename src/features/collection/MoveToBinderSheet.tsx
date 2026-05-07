import { useTranslation } from 'react-i18next';
import { Library } from 'lucide-react';
import { BottomSheet, EmptyState, Skeleton, useToast } from '@/shared/ui';
import { useBinders, useUpdateItem } from './hooks';
import { binderIconEmoji } from './binderIcons';
import type { CollectionItemWithCard } from './repository';

export type MoveToBinderSheetProps = {
  item: CollectionItemWithCard | null;
  onOpenChange: (open: boolean) => void;
};

export function MoveToBinderSheet({ item, onOpenChange }: MoveToBinderSheetProps) {
  const { t } = useTranslation();
  const binders = useBinders();
  const updateItem = useUpdateItem();
  const { show } = useToast();

  function handlePick(binderId: string | null, label: string) {
    if (!item) return;
    void updateItem.mutateAsync({ id: item.id, patch: { binderId } }).then(() => {
      onOpenChange(false);
      show({
        title: t('collection.move.toast.title'),
        description: t('collection.move.toast.description', { name: item.card.name, label }),
        tone: 'success',
      });
    });
  }

  return (
    <BottomSheet
      open={item !== null}
      onOpenChange={onOpenChange}
      title={t('collection.move.title')}
      description={item ? item.card.name : t('collection.move.description')}
    >
      {binders.isPending ? (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <li key={idx}>
              <Skeleton className="h-12 w-full" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-1">
          <li>
            <button
              type="button"
              onClick={() => handlePick(null, t('collection.binders.virtualName'))}
              aria-pressed={item?.binderId === null}
              className={
                'flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
                (item?.binderId === null ? 'bg-fg/5' : '')
              }
            >
              <span aria-hidden="true" className="text-xl">
                📚
              </span>
              <span className="flex-1">{t('collection.binders.virtualName')}</span>
              {item?.binderId === null ? (
                <span aria-hidden="true" className="text-accent">
                  ✓
                </span>
              ) : null}
            </button>
          </li>
          {(binders.data ?? []).map((binder) => {
            const active = item?.binderId === binder.id;
            return (
              <li key={binder.id}>
                <button
                  type="button"
                  onClick={() => handlePick(binder.id, binder.name)}
                  aria-pressed={active}
                  className={
                    'flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
                    (active ? 'bg-fg/5' : '')
                  }
                >
                  <span aria-hidden="true" className="text-xl">
                    {binderIconEmoji(binder.icon)}
                  </span>
                  <span className="flex-1 truncate">{binder.name}</span>
                  {active ? (
                    <span aria-hidden="true" className="text-accent">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
          {(binders.data ?? []).length === 0 ? (
            <li>
              <EmptyState
                icon={<Library className="h-8 w-8" />}
                title={t('collection.move.noneTitle')}
                description={t('collection.move.noneDescription')}
              />
            </li>
          ) : null}
        </ul>
      )}
    </BottomSheet>
  );
}
