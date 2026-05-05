import { Navigate, useLocation } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from './hooks';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data, isPending, isError } = useSession();
  const location = useLocation();
  const { t } = useTranslation();

  if (isPending) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center text-fg-muted"
        role="status"
        aria-live="polite"
      >
        {t('auth.layout.loading')}
      </div>
    );
  }

  if (isError || !data) {
    const redirectParam = `${location.pathname}${location.search}`;
    const search =
      location.pathname === '/' ? '' : `?redirect=${encodeURIComponent(redirectParam)}`;
    return <Navigate to={`/auth/login${search}`} replace />;
  }

  return <>{children}</>;
}
