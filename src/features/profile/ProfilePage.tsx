import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Library } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AlertDialog, Button, Card, PageHeader } from '@/shared/ui';
import { useSession, useSignOut } from '@/features/auth';
import { LanguageSwitcher } from './LanguageSwitcher';

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const signOut = useSignOut();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleSignOut() {
    await signOut.mutateAsync();
    navigate('/auth/login', { replace: true });
  }

  return (
    <>
      <PageHeader title={t('profile.title')} sticky={false} />
      <div className="flex flex-col gap-6 p-4">
        <Card>
          <p className="text-sm text-fg-muted">{t('profile.loggedInAs')}</p>
          <p className="mt-1 break-all font-medium">{session?.email ?? '—'}</p>
        </Card>

        <LanguageSwitcher />

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t('profile.collectionHeading')}
          </h2>
          <Link
            to="/collection/binders"
            className="flex items-center gap-3 rounded-md border border-border bg-bg-raised p-3 text-sm hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Library className="h-5 w-5 text-fg-muted" aria-hidden="true" />
            <span className="flex-1 font-medium">{t('profile.bindersLink')}</span>
            <ChevronRight className="h-4 w-4 text-fg-muted" aria-hidden="true" />
          </Link>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t('profile.applicationHeading')}
          </h2>
          <Card padding="sm" className="text-sm text-fg-muted">
            {t('profile.applicationStub')}
          </Card>
        </section>

        <Button variant="secondary" fullWidth onClick={() => setConfirmOpen(true)}>
          {t('profile.signOut')}
        </Button>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('profile.signOutTitle')}
        description={t('profile.signOutDescription')}
        confirmLabel={signOut.isPending ? t('profile.signingOut') : t('profile.signOut')}
        onConfirm={() => void handleSignOut()}
      />
    </>
  );
}
