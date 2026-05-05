import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CardThumbnail, EmptyState, PageHeader, Skeleton } from '@/shared/ui';
import { DonutChart } from './charts/DonutChart';
import { useStatsByColor } from './hooks';

export function ByColorPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data, isPending, isError } = useStatsByColor();

  if (isPending) {
    return (
      <>
        <PageHeader title={t('stats.byColor.title')} onBack={() => navigate(-1)} />
        <div className="p-4">
          <Skeleton className="mx-auto h-56 w-56 rounded-full" />
        </div>
      </>
    );
  }

  if (isError || !data || data.length === 0) {
    return (
      <>
        <PageHeader title={t('stats.byColor.title')} onBack={() => navigate(-1)} />
        <EmptyState
          title={t('stats.byColor.emptyTitle')}
          description={t('stats.byColor.emptyDescription')}
        />
      </>
    );
  }

  const total = data.reduce((sum, row) => sum + row.count, 0);

  return (
    <>
      <PageHeader title={t('stats.byColor.title')} onBack={() => navigate(-1)} />
      <div className="flex flex-col gap-6 p-4">
        <DonutChart
          slices={data.map((row) => ({
            key: row.bucket,
            label: t(`stats.colors.${row.bucket}`),
            value: row.count,
            color: row.color,
          }))}
          centerValue={total.toLocaleString(i18n.language)}
          centerLabel={t('stats.byColor.centerLabel')}
        />

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t('stats.byColor.legendHeading')}
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-bg-raised">
            {data.map((row) => {
              const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
              return (
                <li key={row.bucket} className="flex items-center gap-3 p-3">
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="flex-1 truncate text-sm">{t(`stats.colors.${row.bucket}`)}</span>
                  <span className="text-sm font-medium tabular-nums">{row.count}</span>
                  <span className="text-xs tabular-nums text-fg-muted">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </section>

        {data.some((row) => row.topCards.length > 0) ? (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
              {t('stats.byColor.topHeading')}
            </h2>
            <div className="flex flex-col gap-4">
              {data
                .filter((row) => row.topCards.length > 0)
                .map((row) => (
                  <article key={row.bucket}>
                    <header className="mb-2 flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <h3 className="text-sm font-semibold">{t(`stats.colors.${row.bucket}`)}</h3>
                    </header>
                    <ul className="flex gap-2 overflow-x-auto pb-2">
                      {row.topCards.map((item) => (
                        <li key={item.id} className="shrink-0">
                          <a
                            href={`/collection/items/${item.id}`}
                            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            <CardThumbnail card={item.card} size="md" />
                            <p className="mt-1 max-w-24 truncate text-xs">{item.card.name}</p>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
