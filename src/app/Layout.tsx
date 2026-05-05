import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Camera, Library, Search, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib';

const tabs = [
  { to: '/', labelKey: 'tabs.collection', icon: Library, end: true },
  { to: '/search', labelKey: 'tabs.search', icon: Search, end: false },
  { to: '/scan', labelKey: 'tabs.scan', icon: Camera, end: false },
  { to: '/stats', labelKey: 'tabs.stats', icon: BarChart3, end: false },
  { to: '/profile', labelKey: 'tabs.profile', icon: User, end: false },
] as const;

export function Layout() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <nav
        aria-label={t('tabs.navigation')}
        className="fixed inset-x-0 bottom-0 z-10 border-t border-fg/10 bg-bg-raised pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
          {tabs.map(({ to, labelKey, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-tap flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs',
                    isActive ? 'font-semibold text-accent' : 'text-fg-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={isActive ? 2.5 : 2} />
                    <span>{t(labelKey)}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
