import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Library, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, CardImageZoom, CardThumbnail, PageHeader, Skeleton } from '@/shared/ui';
import { useOwnedCounts } from '@/features/collection';
import { useCatalogCard, useOtherPrintings } from './hooks';
import { AddToCollectionSheet } from './AddToCollectionSheet';
import type { Card } from '@/shared/domain';

export function CatalogCardDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const card = useCatalogCard(id);
  const ownedCounts = useOwnedCounts();
  const [addOpen, setAddOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  if (card.isPending || !id) {
    return (
      <>
        <PageHeader title={t('search.card.loading')} onBack={() => navigate(-1)} />
        <div className="space-y-3 p-4">
          <Skeleton className="mx-auto aspect-[5/7] w-48" />
          <Skeleton className="mx-auto h-6 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </>
    );
  }

  if (card.isError || !card.data) {
    return (
      <>
        <PageHeader title={t('search.card.notFoundTitle')} onBack={() => navigate(-1)} />
        <p className="p-4 text-fg-muted">
          {t('search.card.notFoundBody')}{' '}
          <Link to="/search" className="text-accent hover:underline">
            {t('search.card.backToSearch')}
          </Link>
        </p>
      </>
    );
  }

  const data = card.data;
  const owned = ownedCounts.data?.get(data.id) ?? 0;
  const meta = data.meta as
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

  return (
    <>
      <PageHeader title={data.name} onBack={() => navigate(-1)} />
      <article className="flex flex-col gap-6 p-4">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label={t('common.zoomImage')}
          className="mx-auto rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <CardThumbnail card={data} size="lg" quality="large" />
        </button>

        {owned > 0 ? (
          <section className="rounded-md border border-success/30 bg-success-bg p-3 text-success">
            <p className="text-sm font-semibold">{t('search.owned.title', { count: owned })}</p>
            <Link
              to={`/?cardId=${data.id}`}
              className="mt-1 inline-block text-xs underline-offset-2 hover:underline"
            >
              {t('search.owned.viewMine')}
            </Link>
          </section>
        ) : null}

        <Button fullWidth onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('search.card.addToCollection')}
        </Button>

        <section className="rounded-md border border-border bg-bg-raised p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t('search.card.characteristics')}
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <Field label={t('collection.item.set')} value={`${data.setName} (${data.setCode})`} />
            <Field label={t('collection.item.collectorNumber')} value={data.collectorNumber} />
            <Field label={t('collection.item.rarity')} value={data.rarity} />
            {data.artist ? <Field label={t('collection.item.artist')} value={data.artist} /> : null}
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
            {data.prices.eur !== undefined ? (
              <Field
                label={t('collection.item.estimatedPrice')}
                value={formatEur(data.prices.eur, i18n.language)}
              />
            ) : null}
          </dl>
          {meta?.oracleText ? (
            <p className="mt-3 whitespace-pre-line text-sm">{meta.oracleText}</p>
          ) : null}
        </section>

        {owned === 0 ? (
          <p className="flex items-center gap-2 text-xs text-fg-muted">
            <Library className="h-3 w-3" aria-hidden="true" />
            {t('search.card.notOwnedHint')}
          </p>
        ) : null}
      </article>

      <OtherPrintingsSection card={data} />

      <AddToCollectionSheet open={addOpen} onOpenChange={setAddOpen} card={data} />
      <CardImageZoom
        open={zoomOpen}
        onOpenChange={setZoomOpen}
        card={data}
        closeLabel={t('common.close')}
      />
    </>
  );
}

function OtherPrintingsSection({ card }: { card: Card }) {
  const { t, i18n } = useTranslation();
  const printings = useOtherPrintings(card);

  // Hide the section entirely while loading or when there are zero results —
  // rendering an empty heading would just be noise.
  if (printings.isPending || !printings.data || printings.data.length === 0) {
    return printings.isPending ? (
      <section className="px-4 pb-4">
        <Skeleton className="h-5 w-40" />
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="aspect-[5/7] w-24 shrink-0" />
          ))}
        </div>
      </section>
    ) : null;
  }

  return (
    <section className="px-4 pb-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">
        {t('search.card.otherPrintings.heading', { count: printings.data.length })}
      </h2>
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {printings.data.map((other) => (
          <li key={other.id} className="shrink-0">
            <Link
              to={`/search/cards/${other.id}`}
              className="block w-24 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label={t('search.card.otherPrintings.itemAria', {
                set: other.setName,
                number: other.collectorNumber,
              })}
            >
              <CardThumbnail card={other} size="md" />
              <p className="mt-1 truncate text-xs font-medium">{other.setName}</p>
              <p className="truncate text-[11px] uppercase text-fg-muted">
                {other.setCode} · #{other.collectorNumber}
              </p>
              {other.prices.eur !== undefined ? (
                <p className="text-[11px] tabular-nums text-fg-muted">
                  {formatEurShort(other.prices.eur, i18n.language)}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatEurShort(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: value < 10 ? 2 : 0,
  }).format(value);
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
