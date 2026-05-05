import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState, PageHeader, Skeleton } from '@/shared/ui';
import { useStatsBySet } from './hooks';

export function BySetPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data, isPending, isError } = useStatsBySet();

  if (isPending) {
    return (
      <>
        <PageHeader title={t('stats.bySet.title')} onBack={() => navigate(-1)} />
        <ul className="flex flex-col gap-3 p-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <li key={idx}>
              <Skeleton className="h-16 w-full" />
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (isError || !data || data.length === 0) {
    return (
      <>
        <PageHeader title={t('stats.bySet.title')} onBack={() => navigate(-1)} />
        <EmptyState
          title={t('stats.bySet.emptyTitle')}
          description={t('stats.bySet.emptyDescription')}
        />
      </>
    );
  }

  const formatPercent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  });

  return (
    <>
      <PageHeader title={t('stats.bySet.title')} onBack={() => navigate(-1)} />
      <div className="flex flex-col gap-3 p-4">
        <p className="text-xs text-fg-muted">
          {t('stats.bySet.headerHint', { count: data.length })}
        </p>
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-bg-raised">
          {data.map((row) => {
            const pctValue = row.totalCards > 0 ? row.completion : 0;
            const pctLabel = row.totalCards > 0 ? formatPercent.format(pctValue) : '—';
            const detail =
              row.totalCards > 0
                ? t('stats.bySet.completion', {
                    owned: row.ownedUnique,
                    total: row.totalCards,
                  })
                : t('stats.bySet.completionUnknown', { owned: row.ownedUnique });
            return (
              <li key={row.setCode}>
                <Link
                  to={`/?setCodes=${encodeURIComponent(row.setCode)}`}
                  aria-label={t('stats.deeplink.viewBySet', { label: row.setName })}
                  className="flex items-center gap-3 p-3 hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {row.iconSvgUri ? (
                    // Scryfall set icons are SVGs without an explicit fill,
                    // so an <img> renders them in solid black — invisible on
                    // dark mode. Treat the SVG as a mask so the visible
                    // silhouette picks up the current text color via bg-fg.
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 shrink-0 bg-fg"
                      style={{
                        maskImage: `url(${row.iconSvgUri})`,
                        WebkitMaskImage: `url(${row.iconSvgUri})`,
                        maskSize: 'contain',
                        WebkitMaskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center',
                      }}
                    />
                  ) : (
                    <span aria-hidden="true" className="h-6 w-6 shrink-0 rounded bg-fg/10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.setName}</p>
                    <p className="truncate text-xs uppercase text-fg-muted">
                      {row.setCode} · {detail}
                    </p>
                    <div
                      role="progressbar"
                      aria-valuenow={Math.round(pctValue * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={t('stats.bySet.progressAria', {
                        set: row.setName,
                        percent: pctLabel,
                      })}
                      className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-fg/10"
                    >
                      <span
                        aria-hidden="true"
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${pctValue * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{pctLabel}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
