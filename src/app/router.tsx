import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/app/Layout';
import { AppGate } from '@/app/AppGate';
import { AuthLayout, RequireAuth } from '@/features/auth';

const CollectionPage = lazy(() =>
  import('@/features/collection').then((m) => ({ default: m.CollectionPage })),
);
const ItemDetailPage = lazy(() =>
  import('@/features/collection').then((m) => ({ default: m.ItemDetailPage })),
);
const ItemEditPage = lazy(() =>
  import('@/features/collection').then((m) => ({ default: m.ItemEditPage })),
);
const SearchPage = lazy(() => import('@/features/search').then((m) => ({ default: m.SearchPage })));
const CatalogCardDetailPage = lazy(() =>
  import('@/features/search').then((m) => ({ default: m.CatalogCardDetailPage })),
);
const ScanPage = lazy(() => import('@/features/scan').then((m) => ({ default: m.ScanPage })));
const StatsPage = lazy(() => import('@/features/stats').then((m) => ({ default: m.StatsPage })));
const ByColorPage = lazy(() =>
  import('@/features/stats').then((m) => ({ default: m.ByColorPage })),
);
const ByTypePage = lazy(() => import('@/features/stats').then((m) => ({ default: m.ByTypePage })));
const ByRarityPage = lazy(() =>
  import('@/features/stats').then((m) => ({ default: m.ByRarityPage })),
);
const BySetPage = lazy(() => import('@/features/stats').then((m) => ({ default: m.BySetPage })));
const ProfilePage = lazy(() =>
  import('@/features/profile').then((m) => ({ default: m.ProfilePage })),
);
const AddManualPage = lazy(() =>
  import('@/features/add').then((m) => ({ default: m.AddManualPage })),
);

const LoginPage = lazy(() => import('@/features/auth').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('@/features/auth').then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth').then((m) => ({ default: m.ForgotPasswordPage })),
);

const OnboardingPage = lazy(() =>
  import('@/features/onboarding').then((m) => ({ default: m.OnboardingPage })),
);

function RouteFallback() {
  const { t } = useTranslation();
  return (
    <div className="p-4 text-fg-muted" role="status" aria-live="polite">
      {t('common.loading')}
    </div>
  );
}

function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{t('notFound.title')}</h1>
      <p className="mt-2 text-fg-muted">{t('notFound.description')}</p>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <AppGate />,
    children: [
      {
        path: '/onboarding',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <OnboardingPage />
          </Suspense>
        ),
      },
      {
        path: '/auth',
        element: <AuthLayout />,
        children: [
          {
            path: 'login',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: 'signup',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <SignupPage />
              </Suspense>
            ),
          },
          {
            path: 'forgot',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <ForgotPasswordPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: '/',
        element: (
          <RequireAuth>
            <Layout />
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<RouteFallback />}>
                <CollectionPage />
              </Suspense>
            ),
          },
          {
            path: 'collection/items/:id',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <ItemDetailPage />
              </Suspense>
            ),
          },
          {
            path: 'collection/items/:id/edit',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <ItemEditPage />
              </Suspense>
            ),
          },
          {
            path: 'search',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <SearchPage />
              </Suspense>
            ),
          },
          {
            path: 'search/cards/:id',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <CatalogCardDetailPage />
              </Suspense>
            ),
          },
          {
            path: 'scan',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <ScanPage />
              </Suspense>
            ),
          },
          {
            path: 'stats/by-color',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <ByColorPage />
              </Suspense>
            ),
          },
          {
            path: 'stats/by-type',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <ByTypePage />
              </Suspense>
            ),
          },
          {
            path: 'stats/by-rarity',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <ByRarityPage />
              </Suspense>
            ),
          },
          {
            path: 'stats/by-set',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <BySetPage />
              </Suspense>
            ),
          },
          {
            path: 'stats',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <StatsPage />
              </Suspense>
            ),
          },
          {
            path: 'profile',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <ProfilePage />
              </Suspense>
            ),
          },
          {
            path: 'add/manual',
            element: (
              <Suspense fallback={<RouteFallback />}>
                <AddManualPage />
              </Suspense>
            ),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
