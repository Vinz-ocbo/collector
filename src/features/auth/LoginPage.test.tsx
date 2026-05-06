import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { AuthError } from './types';
import { makeFakeBackend, renderWithProviders } from '@/test/auth-test-utils';

function renderLogin(backend = makeFakeBackend()) {
  const { Wrapper } = renderWithProviders(
    <Routes>
      <Route path="/" element={<div data-testid="home">home</div>} />
      <Route path="/auth/login" element={<LoginPage />} />
    </Routes>,
    { backend, initialEntries: ['/auth/login'] },
  );
  return render(<Wrapper />);
}

describe('LoginPage', () => {
  it('renders the form fields', () => {
    renderLogin();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });

  it('validates email on blur', async () => {
    renderLogin();
    const email = screen.getByRole('textbox', { name: 'Email' });
    await userEvent.type(email, 'not-an-email');
    await userEvent.tab();
    expect(await screen.findByText(/email invalide/i)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    renderLogin();
    const password = screen.getByLabelText('Mot de passe');
    expect(password).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }));
    expect(password).toHaveAttribute('type', 'text');
  });

  it('shows a generic error on invalid credentials', async () => {
    const backend = makeFakeBackend({
      signInWithPassword: () => Promise.reject(new AuthError('invalid_credentials')),
    });
    renderLogin(backend);
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'foo@x.com');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'Strong123');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect/i);
  });

  it('navigates home after successful sign-in', async () => {
    renderLogin();
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'foo@x.com');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'Strong123');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    await waitFor(() => expect(screen.getByTestId('home')).toBeInTheDocument());
  });

  it('triggers OAuth sign-in via the backend when an OAuth button is clicked', async () => {
    const signInWithOAuth = vi.fn(() => Promise.resolve());
    const backend = makeFakeBackend({ signInWithOAuth });
    renderLogin(backend);
    await userEvent.click(screen.getByRole('button', { name: 'Continuer avec Google' }));
    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledWith('google', undefined));
  });

  it('surfaces a toast when the OAuth provider is not configured', async () => {
    const backend = makeFakeBackend({
      signInWithOAuth: () => Promise.reject(new AuthError('oauth_provider_not_configured')),
    });
    renderLogin(backend);
    await userEvent.click(screen.getByRole('button', { name: 'Continuer avec Google' }));
    expect(await screen.findByText(/Google n’est pas activé/i)).toBeInTheDocument();
  });
});
