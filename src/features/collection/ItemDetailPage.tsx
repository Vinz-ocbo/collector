import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Sparkles, Trash2 } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import {
  AlertDialog,
  Badge,
  Button,
  CardImageZoom,
  CardThumbnail,
  PageHeader,
  Skeleton,
  useToast,
} from '@/shared/ui';
import { useCollectionItem, useDeleteItem } from './hooks';

export function ItemDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: item, isPending, isError } = useCollectionItem(id);
  const deleteItem = useDeleteItem();
  const { show } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  if (!id) return <Navigate to="/" replace />;

  if (isPending) {
    return (
      <>
        <PageHeader title={t('collection.item.title')} onBack={() => navigate(-1)} />
        <div className="space-y-3 p-4">
          <Skeleton className="mx-auto aspect-[5/7] w-48" />
          <Skeleton className="mx-auto h-6 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </>
    );
  }

  if (isError || !item) {
    return (
      <>
        <PageHeader title={t('collection.item.notFoundTitle')} onBack={() => navigate(-1)} />
        <p className="p-4 text-fg-muted">
          {t('collection.item.notFoundBody')}{' '}
          <Link to="/" className="text-accent hover:underline">
            {t('collection.item.backToCollection')}
          </Link>
        </p>
      </>
    );
  }

  const { card } = item;
  const meta = card.meta as
    | {
        manaCost?: string;
        cmc?: number;
        typeLine?: string;
        oracleText?: string;
        power?: string;
        toughness?: string;
        loyalty?: string;
      }
    | undefined;

  async function handleDelete() {
    await deleteItem.mutateAsync({ id: id! });
    show({
      title: t('collection.item.deletedToast.title'),
      description: t('collection.item.deletedToast.description', { name: card.name }),
      tone: 'neutral',
    });
    navigate('/', { replace: true });
  }

  return (
    <>
      <PageHeader title={card.name} onBack={() => navigate(-1)} />
      <article className="flex flex-col gap-6 p-4">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label={t('common.zoomImage')}
          className="mx-auto rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <CardThumbnail card={card} size="lg" quality="large" />
        </button>

        <section className="rounded-md border border-border bg-bg-raised p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t('collection.item.myExemplar')}
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <Field
              label={t('collection.item.quantity')}
              value={t('collection.item.quantityValue', { count: item.quantity })}
            />
            <Field label={t('collection.item.condition')} value={item.condition} />
            <Field
              label={t('collection.item.foil')}
              value={item.foil ? t('common.yes') : t('common.no')}
            />
            <Field label={t('collection.item.language')} value={item.language.toUpperCase()} />
            <Field
              label={t('collection.item.addedAt')}
              value={formatDate(item.addedAt, i18n.language)}
            />
            {item.pricePaid !== undefined ? (
              <Field
                label={t('collection.item.pricePaid')}
                value={formatEur(item.pricePaid, i18n.language)}
              />
            ) : null}
          </dl>
          {item.notes ? (
            <p className="mt-3 rounded-md bg-fg/5 p-3 text-sm text-fg-muted">{item.notes}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link to={`/collection/items/${item.id}/edit`}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                {t('collection.item.edit')}
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t('collection.item.deleteAction')}
            </Button>
          </div>
        </section>

        <section className="rounded-md border border-border bg-bg-raised p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t('collection.item.characteristics')}
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <Field label={t('collection.item.set')} value={`${card.setName} (${card.setCode})`} />
            <Field label={t('collection.item.collectorNumber')} value={card.collectorNumber} />
            <Field label={t('collection.item.rarity')} value={card.rarity} />
            {card.artist ? <Field label={t('collection.item.artist')} value={card.artist} /> : null}
            {meta?.manaCost ? (
              <Field label={t('collection.item.manaCost')} value={meta.manaCost} />
            ) : null}
            {meta?.typeLine ? (
              <Field label={t('collection.item.type')} value={meta.typeLine} />
            ) : null}
            {meta?.power && meta.toughness ? (
              <Field
                label={t('collection.item.powerToughness')}
                value={`${meta.power} / ${meta.toughness}`}
              />
            ) : null}
            {meta?.loyalty ? (
              <Field label={t('collection.item.loyalty')} value={meta.loyalty} />
            ) : null}
            {card.prices.eur !== undefined ? (
              <Field
                label={t('collection.item.estimatedPrice')}
                value={formatEur(card.prices.eur, i18n.language)}
              />
            ) : null}
          </dl>
          {meta?.oracleText ? (
            <p className="mt-3 whitespace-pre-line text-sm">{meta.oracleText}</p>
          ) : null}
          {item.foil ? (
            <Badge tone="accent" className="mt-3">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {t('collection.foil')}
            </Badge>
          ) : null}
        </section>
      </article>

      <AlertDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('collection.item.deleteTitle')}
        description={
          <Trans
            i18nKey="collection.item.deleteDescription"
            values={{ name: card.name, quantity: item.quantity }}
            components={{ strong: <strong /> }}
          />
        }
        confirmLabel={
          deleteItem.isPending ? t('collection.item.deleting') : t('collection.item.deleteConfirm')
        }
        destructive
        onConfirm={() => void handleDelete()}
      />
      <CardImageZoom
        open={zoomOpen}
        onOpenChange={setZoomOpen}
        card={card}
        closeLabel={t('common.close')}
      />
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-fg">{value}</dd>
    </>
  );
}

function formatEur(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: value < 10 ? 2 : 0,
  }).format(value);
}

function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
}
