import { Link } from 'react-router-dom';
import { BarChart3, Library, Palette, Sparkles, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CardThumbnail, EmptyState, PageHeader, Skeleton } from '@/shared/ui';
import { useStatsOverview } from './hooks';

const TILES = [
  { to: '/stats/by-color', labelKey: 'byColor', Icon: Palette },
  { to: '/stats/by-type', labelKey: 'byType', Icon: Library },
  { to: '/stats/by-rarity', labelKey: 'byRarity', Icon: Sparkles },
] as const;

export function StatsPage() {
  const { t, i18n } = useTranslation();
  const { data, isPending, isError } = useStatsOverview();

  if (isPending) {
    return (
      <>
        <PageHeader title={t('stats.title')} sticky={false} />
        <div className="flex flex-col gap-4 p-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title={t('stats.title')} sticky={false} />
        <EmptyState
          title={t('stats.loadingError')}
          description={t('stats.loadingErrorDescription')}
        />
      </>
    );
  }

  if (data.totalQuantity === 0) {
    return (
      <>
        <PageHeader title={t('stats.title')} sticky={false} />
        <EmptyState
          icon={<BarChart3 className="h-12 w-12" />}
          title={t('stats.emptyTitle')}
          description={t('stats.emptyDescription')}
          action={
            <Link to="/" className="text-accent hover:underline">
              {t('stats.emptyAction')}
            </Link>
          }
        />
      </>
    );
  }

  const detail =
    data.thisMonthAddedQuantity > 0
      ? t('stats.kpi.monthAddition', { count: data.thisMonthAddedQuantity })
      : t('stats.kpi.noMonthAddition');

  return (
    <>
      <PageHeader title={t('stats.title')} sticky={false} />
      <div className="flex flex-col gap-5 p-4">
        <KpiCard
          icon={<Library className="h-6 w-6" />}
          title={data.totalQuantity.toLocaleString(i18n.language)}
          subtitle={t('stats.kpi.totalCards')}
          detail={t('stats.kpi.totalCardsDetail', {
            unique: data.uniqueCards,
            duplicates: data.totalQuantity - data.uniqueCards,
          })}
        />
        <KpiCard
          icon={<Tag className="h-6 w-6" />}
          title={formatEur(data.totalValueEur, i18n.language)}
          subtitle={t('stats.kpi.totalValue')}
          detail={detail}
        />

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t('stats.tilesHeading')}
          </h2>
          <ul className="grid grid-cols-3 gap-2">
            {TILES.map(({ to, labelKey, Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex h-full flex-col items-center gap-2 rounded-lg border border-border bg-bg-raised p-3 text-center text-sm hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Icon className="h-6 w-6 text-fg-muted" aria-hidden="true" />
                  <span>{t(`stats.tiles.${labelKey}`)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {data.topByValue.length > 0 ? (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
              {t('stats.topHeading')}
            </h2>
            <ol className="flex flex-col divide-y divide-border rounded-lg border border-border bg-bg-raised">
              {data.topByValue.map((entry, idx) => (
                <li key={entry.item.id}>
                  <Link
                    to={`/collection/items/${entry.item.id}`}
                    className="flex items-center gap-3 p-2 hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="w-5 text-sm font-semibold tabular-nums text-fg-muted">
                      {idx + 1}.
                    </span>
                    <CardThumbnail card={entry.item.card} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.item.card.name}</p>
                      <p className="truncate text-xs text-fg-muted">
                        {entry.item.card.setCode} · ×{entry.item.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatEur(entry.valueEur, i18n.language)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </>
  );
}

function KpiCard({
  icon,
  title,
  subtitle,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  detail?: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-bg-raised p-4">
      <div className="flex items-center gap-3">
        <span className="text-fg-muted" aria-hidden="true">
          {icon}
        </span>
        <div>
          <p className="text-2xl font-bold leading-tight">{title}</p>
          <p className="text-sm text-fg-muted">{subtitle}</p>
        </div>
      </div>
      {detail ? <p className="mt-2 text-xs text-fg-muted">{detail}</p> : null}
    </article>
  );
}

function formatEur(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}
