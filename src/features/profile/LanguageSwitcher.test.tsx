import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { i18n } from '@/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

afterEach(async () => {
  // Unmount before restoring the language so react-i18next's subscriber is
  // gone — otherwise changeLanguage fires a state update outside any act
  // scope. (Tests force FR globally; restore it so later tests don't see EN.)
  cleanup();
  await i18n.changeLanguage('fr');
});

describe('LanguageSwitcher', () => {
  it('marks the current language as the active radio', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('radio', { name: 'Français' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'false');
  });

  it('switches the i18n language when another option is picked', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    // i18next.changeLanguage emits its `languageChanged` event after the
    // click promise resolves; flush microtasks inside act so react-i18next's
    // subscriber updates land inside an act scope.
    await act(async () => {
      await user.click(screen.getByRole('radio', { name: 'English' }));
      await Promise.resolve();
    });

    expect(i18n.resolvedLanguage ?? i18n.language).toBe('en');
    expect(screen.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
  });
});
