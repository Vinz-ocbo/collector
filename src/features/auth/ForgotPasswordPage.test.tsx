import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { renderWithProviders } from '@/test/auth-test-utils';

function renderForgot() {
  const { Wrapper } = renderWithProviders(
    <Routes>
      <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
    </Routes>,
    { initialEntries: ['/auth/forgot'] },
  );
  return render(<Wrapper />);
}

describe('ForgotPasswordPage', () => {
  it('renders the email field', () => {
    renderForgot();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Envoyer le lien' })).toBeInTheDocument();
  });

  it('shows neutral success state regardless of account existence', async () => {
    renderForgot();
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'who@knows.com');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));
    expect(await screen.findByRole('heading', { name: 'Email envoyé' })).toBeInTheDocument();
    // Wording must not reveal whether the account exists.
    expect(screen.getByText(/Si un compte existe avec/i)).toBeInTheDocument();
  });
});
