import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
