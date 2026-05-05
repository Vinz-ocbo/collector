import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Eye, EyeOff, Mail } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Button, Input } from '@/shared/ui';
import { cn, tDynamic } from '@/shared/lib';
import { evaluatePasswordStrength, signupSchema, type SignupInput } from './schemas';
import { useSignIn, useSignUp } from './hooks';
import { AuthError } from './types';

export function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signUp = useSignUp();
  const signIn = useSignIn();
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ email: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '', acceptedTerms: false as unknown as true },
  });

  const password = watch('password') ?? '';
  const strength = evaluatePasswordStrength(password);

  const onSubmit = handleSubmit(async (values) => {
    setGlobalError(null);
    try {
      const result = await signUp.mutateAsync({ email: values.email, password: values.password });
      if (result.requiresVerification) {
        setSubmitted({ email: values.email });
      } else {
        await signIn.mutateAsync({ email: values.email, password: values.password });
        navigate('/', { replace: true });
      }
    } catch (error) {
      if (error instanceof AuthError && error.code === 'email_exists') {
        // Per spec: do not reveal whether the email exists.
        setSubmitted({ email: values.email });
      } else {
        setGlobalError(t('auth.signup.errorGeneric'));
      }
    }
  });

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Mail className="h-10 w-10 text-accent" aria-hidden="true" />
        <h1 className="text-xl font-bold">{t('auth.signup.submitted.title')}</h1>
        <p className="text-sm text-fg-muted">
          <Trans
            i18nKey="auth.signup.submitted.description"
            values={{ email: submitted.email }}
            components={{ strong: <strong /> }}
          />
        </p>
        <Link to="/auth/login" className="text-sm text-accent hover:underline">
          {t('auth.signup.backToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-xl font-bold">{t('auth.signup.title')}</h1>
      </header>

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
          <label htmlFor="signup-email" className="mb-1 block text-sm font-medium">
            {t('auth.signup.email')}
          </label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <p id="signup-email-error" className="mt-1 text-sm text-danger">
              {tDynamic(t, errors.email.message)}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="signup-password" className="mb-1 block text-sm font-medium">
            {t('auth.signup.password')}
          </label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              invalid={Boolean(errors.password)}
              aria-describedby="signup-password-strength"
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
          <ul id="signup-password-strength" aria-live="polite" className="mt-2 space-y-1 text-xs">
            <StrengthRow ok={strength.length} label={t('auth.signup.passwordRules.length')} />
            <StrengthRow ok={strength.hasNumber} label={t('auth.signup.passwordRules.number')} />
            <StrengthRow
              ok={strength.hasUppercase}
              label={t('auth.signup.passwordRules.uppercase')}
            />
          </ul>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-accent"
            {...register('acceptedTerms')}
            aria-invalid={Boolean(errors.acceptedTerms)}
            aria-describedby={errors.acceptedTerms ? 'cgu-error' : undefined}
          />
          <span>
            {t('auth.signup.acceptTermsLabel')}{' '}
            <Link to="/profile/legal" className="text-accent hover:underline">
              {t('auth.signup.acceptTermsLink')}
            </Link>
            .
          </span>
        </label>
        {errors.acceptedTerms ? (
          <p id="cgu-error" className="-mt-2 text-sm text-danger">
            {tDynamic(t, errors.acceptedTerms.message)}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t('auth.signup.submitting') : t('auth.signup.submit')}
        </Button>
      </form>

      <p className="text-center text-sm text-fg-muted">
        {t('auth.signup.alreadyAccount')}{' '}
        <Link to="/auth/login" className="text-accent hover:underline">
          {t('auth.signup.loginLink')}
        </Link>
      </p>
    </div>
  );
}

function StrengthRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={cn('flex items-center gap-1.5', ok ? 'text-success' : 'text-fg-muted')}>
      <Check className={cn('h-3 w-3', ok ? 'opacity-100' : 'opacity-30')} aria-hidden="true" />
      {label}
    </li>
  );
}
