import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import 'fake-indexeddb/auto';
import { OnboardingPage } from './OnboardingPage';
import { renderWithProviders } from '@/test/auth-test-utils';

function setup() {
  indexedDB.deleteDatabase('tcg-collector');
  const { Wrapper } = renderWithProviders(
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/auth/login" element={<div data-testid="login">login</div>} />
    </Routes>,
    { initialEntries: ['/onboarding'] },
  );
  return render(<Wrapper />);
}

describe('OnboardingPage', () => {
  it('starts on the first slide', () => {
    setup();
    expect(screen.getByRole('heading', { name: /partout avec vous/i })).toBeInTheDocument();
  });

  it('progresses through slides via Continuer', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    expect(screen.getByRole('heading', { name: /on s’occupe du reste/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    expect(
      screen.getByRole('heading', { name: /Sans connexion, ça marche aussi/i }),
    ).toBeInTheDocument();
  });

  it('redirects to /auth/login on Commencer', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Commencer' }));
    await waitFor(() => expect(screen.getByTestId('login')).toBeInTheDocument());
  });

  it('lets the user skip from any non-final slide', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /Passer/i }));
    await waitFor(() => expect(screen.getByTestId('login')).toBeInTheDocument());
  });
});
