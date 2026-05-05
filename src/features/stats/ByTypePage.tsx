import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState, PageHeader, Skeleton } from '@/shared/ui';
import { BarChartHorizontal } from './charts/BarChartHorizontal';
import { useStatsByType } from './hooks';

export function ByTypePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isPending, isError } = useStatsByType();

  if (isPending) {
    return (
      <>
        <PageHeader title={t('stats.byType.title')} onBack={() => navigate(-1)} />
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </>
    );
  }

  if (isError || !data || data.length === 0) {
    return (
      <>
        <PageHeader title={t('stats.byType.title')} onBack={() => navigate(-1)} />
        <EmptyState
          title={t('stats.byType.emptyTitle')}
          description={t('stats.byType.emptyDescription')}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title={t('stats.byType.title')} onBack={() => navigate(-1)} />
      <div className="p-4">
        <BarChartHorizontal
          rows={data.map((row) => ({
            key: row.type,
            label: row.type,
            value: row.count,
          }))}
          unit={t('stats.byType.unit')}
          onSelect={(type) => {
            // The 'Other' bucket aggregates everything that didn't match a
            // primary type — there's no equivalent Collection filter, so we
            // just stay on the page rather than producing a misleading deeplink.
            if (type === 'Other') return;
            navigate(`/?types=${encodeURIComponent(type)}`);
          }}
        />
      </div>
    </>
  );
}
