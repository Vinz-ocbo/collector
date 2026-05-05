/**
 * Module augmentation: makes `t('foo.bar')` autocomplete-aware and produces
 * a TS error on missing/typo'd keys.
 */
import 'i18next';
import type fr from './locales/fr.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof fr;
    };
    returnNull: false;
  }
}
