import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Eraser,
  Library,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  BottomSheet,
  Button,
  EmptyState,
  FAB,
  PageHeader,
  Skeleton,
  useToast,
} from '@/shared/ui';
import {
  useBinderSummaries,
  useCollectionSummary,
  useDeleteBinder,
  useEmptyBinder,
  useReorderBinders,
} from './hooks';
import { binderIconEmoji } from './binderIcons';
import type { BinderSummary } from './repository';

export function BindersPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const summaries = useBinderSummaries();
  const overall = useCollectionSummary();
  const deleteBinder = useDeleteBinder();
  const reorderBinders = useReorderBinders();
  const emptyBinder = useEmptyBinder();
  const { show } = useToast();
  const [menuTarget, setMenuTarget] = useState<BinderSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BinderSummary | null>(null);
  const [emptyTarget, setEmptyTarget] = useState<BinderSummary | null>(null);
  const [editMode, setEditMode] = useState(false);

  const isPending = summaries.isPending || overall.isPending;
  const rows = summaries.data ?? [];
  const hasBinders = rows.length > 0;

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    void deleteBinder.mutateAsync({ id: target.binder.id }).then(({ orphaned }) => {
      setDeleteTarget(null);
      show({
        title: t('collection.binders.deletedToast.title'),
        description: t('collection.binders.deletedToast.description', {
          name: target.binder.name,
          count: orphaned,
        }),
        tone: 'success',
      });
    });
  }

  function handleConfirmEmpty() {
    if (!emptyTarget) return;
    const target = emptyTarget;
    void emptyBinder.mutateAsync({ id: target.binder.id }).then(({ orphaned }) => {
      setEmptyTarget(null);
      show({
        title: t('collection.binders.emptiedToast.title'),
        description: t('collection.binders.emptiedToast.description', {
          name: target.binder.name,
          count: orphaned,
        }),
        tone: 'success',
      });
    });
  }

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= rows.length) return;
    const reordered = rows.map((row) => row.binder.id);
    [reordered[index], reordered[next]] = [reordered[next]!, reordered[index]!];
    reorderBinders.mutate(reordered);
  }

  return (
    <>
      <PageHeader
        title={t('collection.binders.title')}
        onBack={() => navigate('/profile')}
        sticky={false}
        actions={
          hasBinders ? (
            <button
              type="button"
              onClick={() => setEditMode((value) => !value)}
              aria-pressed={editMode}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-fg-muted hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {editMode ? t('common.save') : t('collection.binders.edit')}
            </button>
          ) : null
        }
      />

      {isPending ? (
        <ul className="flex flex-col gap-2 p-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <li key={idx}>
              <Skeleton className="h-16 w-full" />
            </li>
          ))}
        </ul>
      ) : summaries.isError || overall.isError ? (
        <EmptyState
          title={t('collection.binders.errorTitle')}
          description={t('collection.binders.errorDescription')}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          <li>
            <Link
              to="/"
              className="flex items-center gap-3 p-4 hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span aria-hidden="true" className="text-2xl">
                📚
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {t('collection.binders.virtualName')}
                </p>
                <p className="truncate text-xs text-fg-muted">
                  {t('collection.binders.itemSummary', {
                    items: overall.data?.totalQuantity ?? 0,
                    value: formatEur(overall.data?.totalValueEur ?? 0, i18n.language),
                  })}
                </p>
              </div>
            </Link>
          </li>

          {!hasBinders ? (
            <li className="p-6 text-center text-sm text-fg-muted">
              {t('collection.binders.emptyHint')}
            </li>
          ) : null}

          {rows.map((row, index) => (
            <li key={row.binder.id} className="flex items-center">
              {editMode ? (
                <div className="flex flex-1 items-center gap-3 p-4">
                  <span aria-hidden="true" className="text-2xl">
                    {binderIconEmoji(row.binder.icon)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{row.binder.name}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {t('collection.binders.itemSummary', {
                        items: row.totalQuantity,
                        value: formatEur(row.totalValueEur, i18n.language),
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <Link
                  to={`/?binderId=${encodeURIComponent(row.binder.id)}`}
                  className="flex flex-1 items-center gap-3 p-4 hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span aria-hidden="true" className="text-2xl">
                    {binderIconEmoji(row.binder.icon)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{row.binder.name}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {t('collection.binders.itemSummary', {
                        items: row.totalQuantity,
                        value: formatEur(row.totalValueEur, i18n.language),
                      })}
                    </p>
                    {row.binder.description ? (
                      <p className="mt-0.5 truncate text-xs text-fg-muted">
                        {row.binder.description}
                      </p>
                    ) : null}
                  </div>
                </Link>
              )}

              {editMode ? (
                <div className="mr-2 flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={t('collection.binders.moveUp', { name: row.binder.name })}
                    disabled={index === 0 || reorderBinders.isPending}
                    onClick={() => move(index, -1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-fg-muted hover:bg-fg/5 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={t('collection.binders.moveDown', { name: row.binder.name })}
                    disabled={index === rows.length - 1 || reorderBinders.isPending}
                    onClick={() => move(index, 1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-fg-muted hover:bg-fg/5 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={t('collection.binders.menuAria', { name: row.binder.name })}
                  onClick={() => setMenuTarget(row)}
                  className="mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-fg/5 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <MoreVertical className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isPending && !hasBinders ? (
        <div className="p-4">
          <EmptyState
            icon={<Library className="h-10 w-10" />}
            title={t('collection.binders.emptyTitle')}
            description={t('collection.binders.emptyDescription')}
            action={
              <Button onClick={() => navigate('/collection/binders/new')}>
                {t('collection.binders.create')}
              </Button>
            }
          />
        </div>
      ) : null}

      {!editMode ? (
        <FAB
          ariaLabel={t('collection.binders.create')}
          onClick={() => navigate('/collection/binders/new')}
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </FAB>
      ) : null}

      <BottomSheet
        open={menuTarget !== null}
        onOpenChange={(open) => {
          if (!open) setMenuTarget(null);
        }}
        title={menuTarget ? menuTarget.binder.name : t('collection.binders.menuTitle')}
        description={t('collection.binders.menuDescription')}
      >
        {menuTarget ? (
          <ul className="flex flex-col gap-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  const target = menuTarget;
                  setMenuTarget(null);
                  navigate(`/collection/binders/${target.binder.id}/edit`);
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
                disabled={menuTarget.totalQuantity === 0}
                onClick={() => {
                  const target = menuTarget;
                  setMenuTarget(null);
                  setEmptyTarget(target);
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Eraser className="h-4 w-4 text-fg-muted" aria-hidden="true" />
                {t('collection.binders.empty')}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  const target = menuTarget;
                  setMenuTarget(null);
                  setDeleteTarget(target);
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-danger hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t('common.delete')}
              </button>
            </li>
          </ul>
        ) : null}
      </BottomSheet>

      <AlertDialog
        open={emptyTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEmptyTarget(null);
        }}
        title={t('collection.binders.emptyConfirmTitle')}
        description={
          emptyTarget
            ? t('collection.binders.emptyConfirmDescription', {
                name: emptyTarget.binder.name,
                count: emptyTarget.totalQuantity,
              })
            : ''
        }
        confirmLabel={
          emptyBinder.isPending ? t('common.loading') : t('collection.binders.emptyConfirm')
        }
        onConfirm={handleConfirmEmpty}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t('collection.binders.deleteTitle')}
        description={
          deleteTarget
            ? t('collection.binders.deleteDescription', {
                name: deleteTarget.binder.name,
                count: deleteTarget.totalQuantity,
              })
            : ''
        }
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
