import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { createMockAuthBackend } from './mockBackend';
import { AuthError } from './types';

beforeEach(() => {
  // Reset IndexedDB between tests by re-creating the backend (deletes are
  // not enough; we want a clean slate for every test).
  indexedDB.deleteDatabase('tcg-collector-mock-auth');
  sessionStorage.clear();
});

afterEach(() => {
  sessionStorage.clear();
});

describe('mockBackend', () => {
  it('starts with no session', async () => {
    const backend = createMockAuthBackend();
    expect(await backend.getSession()).toBeNull();
  });

  it('signs up and then signs in', async () => {
    const backend = createMockAuthBackend();
    const result = await backend.signUpWithPassword('foo@example.com', 'Strong123');
    expect(result.requiresVerification).toBe(false);
    const session = await backend.signInWithPassword('foo@example.com', 'Strong123');
    expect(session.email).toBe('foo@example.com');
  });

  it('rejects existing email on signup', async () => {
    const backend = createMockAuthBackend();
    await backend.signUpWithPassword('foo@example.com', 'Strong123');
    await expect(backend.signUpWithPassword('foo@example.com', 'Strong123')).rejects.toBeInstanceOf(
      AuthError,
    );
  });

  it('rejects wrong password', async () => {
    const backend = createMockAuthBackend();
    await backend.signUpWithPassword('foo@example.com', 'Strong123');
    await expect(backend.signInWithPassword('foo@example.com', 'WrongPwd1')).rejects.toBeInstanceOf(
      AuthError,
    );
  });

  it('rejects unknown email with the same code', async () => {
    const backend = createMockAuthBackend();
    await expect(backend.signInWithPassword('ghost@x.com', 'Strong123')).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
  });

  it('signs out and clears the session', async () => {
    const backend = createMockAuthBackend();
    await backend.signUpWithPassword('foo@example.com', 'Strong123');
    await backend.signInWithPassword('foo@example.com', 'Strong123');
    await backend.signOut();
    expect(await backend.getSession()).toBeNull();
  });

  it('persists session across backend instantiations', async () => {
    const backend = createMockAuthBackend();
    await backend.signUpWithPassword('foo@example.com', 'Strong123');
    await backend.signInWithPassword('foo@example.com', 'Strong123');
    const next = createMockAuthBackend();
    const session = await next.getSession();
    expect(session?.email).toBe('foo@example.com');
  });

  it('requestPasswordReset always resolves (no leak)', async () => {
    const backend = createMockAuthBackend();
    await expect(backend.requestPasswordReset('any@x.com')).resolves.toBeUndefined();
  });

  it('normalizes email case on lookup', async () => {
    const backend = createMockAuthBackend();
    await backend.signUpWithPassword('Foo@Example.COM', 'Strong123');
    const session = await backend.signInWithPassword('FOO@example.com', 'Strong123');
    expect(session.email).toBe('foo@example.com');
  });
});
