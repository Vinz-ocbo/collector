import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOnboardingStatus } from '@/features/onboarding';

/**
 * Top-level routing gate. Currently enforces:
 *  - First-launch users land on /onboarding (until they finish or skip).
 *  - Once onboarding is completed, /onboarding redirects to /auth/login.
 *
 * Auth gating happens deeper, inside <RequireAuth> on the protected routes,
 * so /auth/* and /onboarding remain reachable from any state.
 */
export function AppGate() {
  const { data: completedAt, isPending } = useOnboardingStatus();
  const location = useLocation();
  const { t } = useTranslation();

  if (isPending) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center text-fg-muted"
        role="status"
        aria-live="polite"
      >
        {t('appGate.loading')}
      </div>
    );
  }

  const onOnboarding = location.pathname === '/onboarding';
  if (!completedAt && !onOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  if (completedAt && onOnboarding) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
