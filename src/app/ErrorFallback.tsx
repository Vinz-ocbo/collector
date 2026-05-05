import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui';

export type ErrorFallbackProps = {
  error: unknown;
  resetError?: () => void;
};

/**
 * Top-level fallback rendered by the SentryErrorBoundary when the React
 * tree below crashes. Keep it minimal — it must not import any code that
 * could itself fail (no router, no query client). Reload restarts the app.
 */
export function ErrorFallback({ resetError }: ErrorFallbackProps) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <AlertTriangle className="h-12 w-12 text-danger" aria-hidden="true" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t('errorBoundary.title')}</h1>
        <p className="text-sm text-fg-muted">{t('errorBoundary.description')}</p>
      </div>
      <div className="flex gap-2">
        {resetError ? (
          <Button variant="secondary" onClick={resetError}>
            {t('errorBoundary.retry')}
          </Button>
        ) : null}
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t('errorBoundary.reload')}
        </Button>
      </div>
    </div>
  );
}
