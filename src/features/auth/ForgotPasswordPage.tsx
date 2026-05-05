import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Button, Input } from '@/shared/ui';
import { tDynamic } from '@/shared/lib';
import { forgotPasswordSchema, type ForgotPasswordInput } from './schemas';
import { useRequestPasswordReset } from './hooks';

const RESEND_COOLDOWN_S = 60;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const requestReset = useRequestPasswordReset();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = window.setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [cooldown]);

  const onSubmit = handleSubmit(async (values) => {
    // Always succeed visually (per .clinerules-dev §5: do not leak account existence).
    await requestReset.mutateAsync({ email: values.email }).catch(() => undefined);
    setSubmittedEmail(values.email);
    setCooldown(RESEND_COOLDOWN_S);
  });

  if (submittedEmail) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Mail className="h-10 w-10 text-accent" aria-hidden="true" />
        <h1 className="text-xl font-bold">{t('auth.forgot.submitted.title')}</h1>
        <p className="text-sm text-fg-muted">
          <Trans
            i18nKey="auth.forgot.submitted.description"
            values={{ email: submittedEmail }}
            components={{ strong: <strong /> }}
          />
        </p>
        <Button
          variant="secondary"
          fullWidth
          disabled={cooldown > 0}
          onClick={() => {
            void onSubmit();
          }}
        >
          {cooldown > 0
            ? t('auth.forgot.resendCooldown', { seconds: cooldown })
            : t('auth.forgot.resend')}
        </Button>
        <Link to="/auth/login" className="text-sm text-accent hover:underline">
          {t('auth.forgot.backToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-xl font-bold">{t('auth.forgot.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('auth.forgot.subtitle')}</p>
      </header>

      <form
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        noValidate
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="forgot-email" className="mb-1 block text-sm font-medium">
            {t('auth.forgot.email')}
          </label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'forgot-email-error' : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <p id="forgot-email-error" className="mt-1 text-sm text-danger">
              {tDynamic(t, errors.email.message)}
            </p>
          ) : null}
        </div>

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
        </Button>
      </form>

      <p className="text-center">
        <Link to="/auth/login" className="text-sm text-accent hover:underline">
          {t('auth.forgot.backToLogin')}
        </Link>
      </p>
    </div>
  );
}
