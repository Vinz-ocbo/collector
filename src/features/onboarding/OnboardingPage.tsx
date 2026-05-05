import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Cloud, Library } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { getPreference, setPreference } from '@/shared/db';

const ONBOARDING_KEY = 'onboardingCompletedAt';

export function useOnboardingStatus() {
  return useQuery<string | null>({
    queryKey: ['preferences', ONBOARDING_KEY],
    queryFn: async () => (await getPreference<string>(ONBOARDING_KEY)) ?? null,
    staleTime: Infinity,
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      await setPreference(ONBOARDING_KEY, now);
      return now;
    },
    onSuccess: (value) => {
      qc.setQueryData(['preferences', ONBOARDING_KEY], value);
    },
  });
}

const slides = [
  { icon: Library, key: '1' },
  { icon: Camera, key: '2' },
  { icon: Cloud, key: '3' },
] as const;

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const completeOnboarding = useCompleteOnboarding();
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  if (!slide) return null;

  const isLast = index === slides.length - 1;
  const Icon = slide.icon;

  async function finish() {
    await completeOnboarding.mutateAsync();
    navigate('/auth/login', { replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg px-6 py-8">
      <header className="flex items-center justify-between">
        {index > 0 ? (
          <button
            type="button"
            onClick={() => setIndex((i) => i - 1)}
            className="text-sm text-fg-muted hover:text-fg"
          >
            {t('onboarding.back')}
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
        {!isLast ? (
          <button
            type="button"
            onClick={() => void finish()}
            className="text-sm text-fg-muted hover:text-fg"
          >
            {t('onboarding.skip')}
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
      </header>

      <main
        className="flex flex-1 flex-col items-center justify-center text-center"
        aria-live="polite"
      >
        <Icon className="h-16 w-16 text-accent" aria-hidden="true" />
        <h1 className="mt-8 text-2xl font-bold">{t(`onboarding.slides.${slide.key}.title`)}</h1>
        <p className="mt-3 max-w-md text-fg-muted">
          {t(`onboarding.slides.${slide.key}.description`)}
        </p>
      </main>

      <footer className="flex flex-col items-center gap-6">
        <ol className="flex items-center gap-2" aria-label={t('onboarding.progressLabel')}>
          {slides.map((s, i) => (
            <li key={s.key}>
              <span
                aria-current={i === index ? 'step' : undefined}
                aria-label={t('onboarding.stepLabel', {
                  current: i + 1,
                  total: slides.length,
                })}
                className={cn(
                  'block h-2 rounded-full transition-all',
                  i === index ? 'w-6 bg-accent' : 'w-2 bg-fg/20',
                )}
              />
            </li>
          ))}
        </ol>
        <Button
          fullWidth
          onClick={() => (isLast ? void finish() : setIndex((i) => i + 1))}
          disabled={completeOnboarding.isPending}
        >
          {isLast ? t('onboarding.start') : t('onboarding.continue')}
        </Button>
      </footer>
    </div>
  );
}
