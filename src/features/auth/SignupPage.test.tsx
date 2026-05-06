import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { SignupPage } from './SignupPage';
import { AuthError } from './types';
import { makeFakeBackend, renderWithProviders } from '@/test/auth-test-utils';

function renderSignup(backend = makeFakeBackend()) {
  const { Wrapper } = renderWithProviders(
    <Routes>
      <Route path="/" element={<div data-testid="home">home</div>} />
      <Route path="/auth/signup" element={<SignupPage />} />
    </Routes>,
    { backend, initialEntries: ['/auth/signup'] },
  );
  return render(<Wrapper />);
}

describe('SignupPage', () => {
  it('renders password strength checklist', () => {
    renderSignup();
    expect(screen.getByText('8 caractères minimum')).toBeInTheDocument();
    expect(screen.getByText('1 chiffre')).toBeInTheDocument();
    expect(screen.getByText('1 majuscule')).toBeInTheDocument();
  });

  it('updates strength checklist live as the user types', async () => {
    renderSignup();
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'Strong123');
    const lengthRule = screen.getByText('8 caractères minimum').closest('li');
    expect(lengthRule).toHaveClass('text-success');
  });

  it('requires CGU acceptance', async () => {
    renderSignup();
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'foo@x.com');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'Strong123');
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(await screen.findByText(/accepter les CGU/i)).toBeInTheDocument();
  });

  it('shows neutral confirmation when email already exists (no leak)', async () => {
    const backend = makeFakeBackend({
      signUpWithPassword: () => Promise.reject(new AuthError('email_exists')),
    });
    renderSignup(backend);
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'foo@x.com');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'Strong123');
    await userEvent.click(screen.getByLabelText(/CGU/i));
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(
      await screen.findByRole('heading', { name: /Vérifiez votre email/i }),
    ).toBeInTheDocument();
  });

  it('renders OAuth buttons and triggers the backend on click', async () => {
    const signInWithOAuth = vi.fn(() => Promise.resolve());
    const backend = makeFakeBackend({ signInWithOAuth });
    renderSignup(backend);
    await userEvent.click(screen.getByRole('button', { name: /Google/i }));
    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledWith('google', undefined));
  });

  it('shows a toast when the OAuth provider is not configured', async () => {
    const backend = makeFakeBackend({
      signInWithOAuth: () => Promise.reject(new AuthError('oauth_provider_not_configured')),
    });
    renderSignup(backend);
    await userEvent.click(screen.getByRole('button', { name: /Google/i }));
    expect(await screen.findByText(/Google n’est pas activé/i)).toBeInTheDocument();
  });
});
