import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input, useToast } from '@/shared/ui';
import { tDynamic } from '@/shared/lib';
import { loginSchema, type LoginInput } from './schemas';
import { useSignIn } from './hooks';
import { AuthError } from './types';

export function LoginPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const signIn = useSignIn();
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    setGlobalError(null);
    try {
      await signIn.mutateAsync(values);
      const redirect = searchParams.get('redirect');
      navigate(redirect ?? '/', { replace: true });
    } catch (error) {
      if (error instanceof AuthError && error.code === 'invalid_credentials') {
        setGlobalError(t('auth.login.errorInvalidCredentials'));
      } else {
        setGlobalError(t('auth.login.errorGeneric'));
      }
    }
  });

  const handleOAuthStub = (provider: string) => {
    show({
      title: t('auth.login.oauthSoon.title', { provider }),
      description: t('auth.login.oauthSoon.description'),
      tone: 'info',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <div className="mx-auto h-12 w-12 rounded-md bg-accent" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold">{t('auth.login.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('auth.login.subtitle')}</p>
      </header>

      <div className="flex flex-col gap-2">
        <Button variant="secondary" fullWidth onClick={() => handleOAuthStub('Google')}>
          {t('auth.login.google')}
        </Button>
        <Button variant="secondary" fullWidth onClick={() => handleOAuthStub('Apple')}>
          {t('auth.login.apple')}
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs text-fg-muted">
        <div className="h-px flex-1 bg-border" />
        <span>{t('auth.login.or')}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        noValidate
        className="flex flex-col gap-4"
      >
        {globalError ? (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger"
          >
            {globalError}
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            {t('auth.login.email')}
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <p id="email-error" className="mt-1 text-sm text-danger">
              {tDynamic(t, errors.email.message)}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            {t('auth.login.password')}
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className="pr-12"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')
              }
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-fg-muted hover:text-fg"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p id="password-error" className="mt-1 text-sm text-danger">
              {tDynamic(t, errors.password.message)}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Link to="/auth/forgot" className="text-sm text-accent hover:underline">
            {t('auth.login.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>

      <p className="text-center text-sm text-fg-muted">
        {t('auth.login.noAccount')}{' '}
        <Link to="/auth/signup" className="text-accent hover:underline">
          {t('auth.login.signupLink')}
        </Link>
      </p>
    </div>
  );
}
