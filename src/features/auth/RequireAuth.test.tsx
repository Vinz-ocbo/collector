import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { makeFakeBackend, renderWithProviders } from '@/test/auth-test-utils';

function setup(opts: { signedIn: boolean; initialPath: string }) {
  const backend = makeFakeBackend();
  // Pre-sign-in if needed: use the fake backend's signIn to set session
  const promise = opts.signedIn
    ? backend.signInWithPassword('foo@x.com', 'Strong123').then(() => undefined)
    : Promise.resolve(undefined);
  return promise.then(() => {
    const { Wrapper } = renderWithProviders(
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <div data-testid="protected">protected content</div>
            </RequireAuth>
          }
        />
        <Route path="/auth/login" element={<div data-testid="login">login</div>} />
      </Routes>,
      { backend, initialEntries: [opts.initialPath] },
    );
    return render(<Wrapper />);
  });
}

describe('RequireAuth', () => {
  it('renders the protected content when a session exists', async () => {
    await setup({ signedIn: true, initialPath: '/' });
    await waitFor(() => expect(screen.getByTestId('protected')).toBeInTheDocument());
  });

  it('redirects to /auth/login when no session', async () => {
    await setup({ signedIn: false, initialPath: '/' });
    await waitFor(() => expect(screen.getByTestId('login')).toBeInTheDocument());
  });
});
