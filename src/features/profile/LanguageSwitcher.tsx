import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
] as const;

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
        {t('profile.languageHeading')}
      </h2>
      <Card padding="sm" className="flex flex-col gap-3">
        <p className="text-sm text-fg-muted">{t('profile.languageDescription')}</p>
        <div role="radiogroup" aria-label={t('profile.languageSelectLabel')} className="flex gap-2">
          {LANGUAGES.map((lang) => {
            const active = current === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => void i18n.changeLanguage(lang.code)}
                className={
                  'min-h-tap flex-1 rounded-md border px-3 text-sm font-medium transition-colors ' +
                  (active
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-border bg-bg-raised text-fg hover:bg-fg/5')
                }
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
