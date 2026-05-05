import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Eraser, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AlertDialog, BottomSheet, Skeleton, useToast } from '@/shared/ui';
import { useBinder, useDeleteBinder, useEmptyBinder } from './hooks';
import { binderIconEmoji } from './binderIcons';

export type BinderHeaderProps = {
  binderId: string;
  /**
   * Total quantity owned in this binder (computed by the parent — the page
   * already runs `useCollectionItems` filtered on this binder).
   */
  itemCount: number;
  totalValueEur: number;
  /**
   * Locale for the EUR formatter — defers to the page so we don't ship a
   * second i18n hook just for currency.
   */
  locale: string;
  /**
   * Called when the binder this header points at is deleted. The parent
   * should clear the URL filter so the user lands back on a coherent page.
   */
  onAfterDelete: () => void;
};

export function BinderHeader({
  binderId,
  itemCount,
  totalValueEur,
  locale,
  onAfterDelete,
}: BinderHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { show } = useToast();
  const binder = useBinder(binderId);
  const deleteBinder = useDeleteBinder();
  const emptyBinder = useEmptyBinder();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [emptyConfirm, setEmptyConfirm] = useState(false);

  function handleConfirmDelete() {
    void deleteBinder.mutateAsync({ id: binderId }).then(({ orphaned }) => {
      setDeleteConfirm(false);
      show({
        title: t('collection.binders.deletedToast.title'),
        description: t('collection.binders.deletedToast.description', {
          name: binder.data?.name ?? '',
          count: orphaned,
        }),
        tone: 'success',
      });
      onAfterDelete();
    });
  }

  function handleConfirmEmpty() {
    void emptyBinder.mutateAsync({ id: binderId }).then(({ orphaned }) => {
      setEmptyConfirm(false);
      show({
        title: t('collection.binders.emptiedToast.title'),
        description: t('collection.binders.emptiedToast.description', {
          name: binder.data?.name ?? '',
          count: orphaned,
        }),
        tone: 'success',
      });
    });
  }

  // Loading shell — match the height of the real header so the page doesn't
  // jump when the binder query resolves.
  if (binder.isPending) {
    return (
      <header className="flex items-center gap-2 border-b border-border bg-bg-raised px-2 py-2">
        <button
          type="button"
          onClick={() => navigate('/collection/binders')}
          aria-label={t('common.back')}
          className="flex min-h-tap min-w-tap items-center justify-center rounded-md text-fg-muted hover:bg-fg/5"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <Skeleton className="h-6 w-40" />
      </header>
    );
  }

  // Binder not found (deleted in another tab, stale deeplink, etc.). Render
  // the back button only — the page will fall back to the generic header.
  if (!binder.data) return null;

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border bg-bg-raised px-2 py-2">
        <button
          type="button"
          onClick={() => navigate('/collection/binders')}
          aria-label={t('common.back')}
          className="flex min-h-tap min-w-tap items-center justify-center rounded-md text-fg-muted hover:bg-fg/5"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <span aria-hidden="true" className="shrink-0 text-2xl">
          {binderIconEmoji(binder.data.icon)}
        </span>

        <div className="min-w-0 flex-1 px-1">
          <h1 className="truncate text-base font-semibold text-fg">{binder.data.name}</h1>
          <p className="truncate text-xs text-fg-muted">
            {t('collection.binders.itemSummary', {
              items: itemCount,
              value: formatEur(totalValueEur, locale),
            })}
          </p>
        </div>

        <button
          type="button"
          aria-label={t('collection.binders.menuAria', { name: binder.data.name })}
          onClick={() => setMenuOpen(true)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-fg/5 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <BottomSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title={binder.data.name}
        description={t('collection.binders.menuDescription')}
      >
        <ul className="flex flex-col gap-1">
          <li>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigate(`/collection/binders/${binderId}/edit`);
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Pencil className="h-4 w-4 text-fg-muted" aria-hidden="true" />
              {t('collection.binders.rename')}
            </button>
          </li>
          <li>
            <button
              type="button"
              disabled={itemCount === 0}
              onClick={() => {
                setMenuOpen(false);
                setEmptyConfirm(true);
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium hover:bg-fg/5 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Eraser className="h-4 w-4 text-fg-muted" aria-hidden="true" />
              {t('collection.binders.empty')}
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setDeleteConfirm(true);
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-danger hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t('common.delete')}
            </button>
          </li>
        </ul>
      </BottomSheet>

      <AlertDialog
        open={emptyConfirm}
        onOpenChange={setEmptyConfirm}
        title={t('collection.binders.emptyConfirmTitle')}
        description={t('collection.binders.emptyConfirmDescription', {
          name: binder.data.name,
          count: itemCount,
        })}
        confirmLabel={
          emptyBinder.isPending ? t('common.loading') : t('collection.binders.emptyConfirm')
        }
        onConfirm={handleConfirmEmpty}
      />

      <AlertDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title={t('collection.binders.deleteTitle')}
        description={t('collection.binders.deleteDescription', {
          name: binder.data.name,
          count: itemCount,
        })}
        confirmLabel={
          deleteBinder.isPending ? t('common.loading') : t('collection.binders.deleteConfirm')
        }
        destructive
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

function formatEur(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}
