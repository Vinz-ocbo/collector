import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState, PageHeader, Skeleton } from '@/shared/ui';
import { BarChartHorizontal } from './charts/BarChartHorizontal';
import { DonutChart } from './charts/DonutChart';
import { useStatsByRarity } from './hooks';

export function ByRarityPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data, isPending, isError } = useStatsByRarity();

  if (isPending) {
    return (
      <>
        <PageHeader title={t('stats.byRarity.title')} onBack={() => navigate(-1)} />
        <div className="p-4">
          <Skeleton className="mx-auto h-56 w-56 rounded-full" />
        </div>
      </>
    );
  }

  if (isError || !data || data.length === 0) {
    return (
      <>
        <PageHeader title={t('stats.byRarity.title')} onBack={() => navigate(-1)} />
        <EmptyState
          title={t('stats.byRarity.emptyTitle')}
          description={t('stats.byRarity.emptyDescription')}
        />
      </>
    );
  }

  const total = data.reduce((sum, row) => sum + row.count, 0);

  return (
    <>
      <PageHeader title={t('stats.byRarity.title')} onBack={() => navigate(-1)} />
      <div className="flex flex-col gap-6 p-4">
        <DonutChart
          slices={data.map((row) => ({
            key: row.rarity,
            label: t(`stats.rarities.${row.rarity}`),
            value: row.count,
            color: row.color,
          }))}
          centerValue={total.toLocaleString(i18n.language)}
          centerLabel={t('stats.byRarity.centerLabel')}
        />

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t('stats.byRarity.legendHeading')}
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-bg-raised">
            {data.map((row) => {
              const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
              const label = t(`stats.rarities.${row.rarity}`);
              return (
                <li key={row.rarity}>
                  <Link
                    to={`/?rarities=${row.rarity}`}
                    className="flex items-center gap-3 p-3 hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={t('stats.deeplink.viewByRarity', { label })}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="flex-1 truncate text-sm">{label}</span>
                    <span className="text-sm font-medium tabular-nums">{row.count}</span>
                    <span className="text-xs tabular-nums text-fg-muted">{pct}%</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t('stats.byRarity.valueHeading')}
          </h2>
          <BarChartHorizontal
            rows={data.map((row) => ({
              key: row.rarity,
              label: t(`stats.rarities.${row.rarity}`),
              value: Math.round(row.totalValueEur),
              color: row.color,
            }))}
            unit={t('stats.byRarity.unit')}
            onSelect={(rarity) => navigate(`/?rarities=${rarity}`)}
          />
        </section>
      </div>
    </>
  );
}
