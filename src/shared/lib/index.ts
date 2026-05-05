import { clsx, type ClassValue } from 'clsx';
import type { TFunction } from 'i18next';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Translate a runtime-built key (typically a Zod error message stored as
 * an i18n key). Bypasses the strict-key typing from i18next module
 * augmentation. Returns '' for undefined/empty input.
 */
export function tDynamic(t: TFunction, key: string | undefined | null): string {
  if (!key) return '';
  return (t as unknown as (k: string) => string)(key);
}
