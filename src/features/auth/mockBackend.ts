/**
 * Mock auth backend backed by IndexedDB (Dexie). Dev-only — DO NOT ship to prod.
 *
 * Implements the AuthBackend interface so the rest of the app cannot tell the
 * difference between this and a real provider (Auth0/Clerk/Supabase). When a
 * real provider is wired in, swap the implementation passed to AuthBackendProvider.
 */

import Dexie, { type Table } from 'dexie';
import {
  AuthError,
  type AuthBackend,
  type OAuthProvider,
  type Session,
  type SignUpResult,
} from './types';

type StoredUser = {
  id: string;
  email: string;
  /** SHA-256 hash, hex-encoded. Mock-grade — NOT a real production scheme. */
  passwordHash: string;
  createdAt: string;
};

type StoredSession = {
  id: string;
  userId: string;
  email: string;
  expiresAt: string;
};

class MockAuthDB extends Dexie {
  users!: Table<StoredUser, string>;
  sessions!: Table<StoredSession, string>;
  constructor() {
    super('tcg-collector-mock-auth');
    this.version(1).stores({
      users: 'id, &email',
      sessions: 'id, userId, expiresAt',
    });
  }
}

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
const ACTIVE_SESSION_KEY = 'mock-auth.activeSessionId';

async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function newId(): string {
  return crypto.randomUUID();
}

export function createMockAuthBackend(): AuthBackend {
  const db = new MockAuthDB();

  function readActiveSessionId(): string | null {
    try {
      return sessionStorage.getItem(ACTIVE_SESSION_KEY);
    } catch {
      return null;
    }
  }

  function writeActiveSessionId(id: string | null): void {
    try {
      if (id) sessionStorage.setItem(ACTIVE_SESSION_KEY, id);
      else sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch {
      // sessionStorage unavailable (eg. private mode) — sessions are then
      // single-tab-only, which is acceptable for a dev mock.
    }
  }

  return {
    async getSession(): Promise<Session | null> {
      const id = readActiveSessionId();
      if (!id) return null;
      const stored = await db.sessions.get(id);
      if (!stored) {
        writeActiveSessionId(null);
        return null;
      }
      if (new Date(stored.expiresAt).getTime() < Date.now()) {
        await db.sessions.delete(id);
        writeActiveSessionId(null);
        return null;
      }
      return { userId: stored.userId, email: stored.email, expiresAt: stored.expiresAt };
    },

    async signInWithPassword(email: string, password: string): Promise<Session> {
      const normalized = email.trim().toLowerCase();
      const user = await db.users.where('email').equals(normalized).first();
      const expectedHash = await hashPassword(password);
      if (!user || user.passwordHash !== expectedHash) {
        throw new AuthError('invalid_credentials');
      }
      const session: StoredSession = {
        id: newId(),
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      };
      await db.sessions.put(session);
      writeActiveSessionId(session.id);
      return { userId: session.userId, email: session.email, expiresAt: session.expiresAt };
    },

    async signUpWithPassword(email: string, password: string): Promise<SignUpResult> {
      const normalized = email.trim().toLowerCase();
      const existing = await db.users.where('email').equals(normalized).first();
      if (existing) throw new AuthError('email_exists');
      const user: StoredUser = {
        id: newId(),
        email: normalized,
        passwordHash: await hashPassword(password),
        createdAt: new Date().toISOString(),
      };
      await db.users.put(user);
      // Real providers usually require email verification; the mock skips it.
      return { requiresVerification: false };
    },

    async signOut(): Promise<void> {
      const id = readActiveSessionId();
      if (id) await db.sessions.delete(id);
      writeActiveSessionId(null);
    },

    async requestPasswordReset(_email: string): Promise<void> {
      // Mock: pretend we sent an email regardless of account existence
      // (per .clinerules-dev §5: do not leak account existence).
      await new Promise((resolve) => setTimeout(resolve, 200));
    },

    async signInWithOAuth(provider: OAuthProvider): Promise<void> {
      // The real backend redirects to the provider; the dev mock instead
      // immediately materialises a session so the OAuth button is testable
      // without a Supabase project. The synthetic email keeps mock OAuth
      // accounts visually distinct from password-based ones.
      const email = `${provider}-user@oauth-mock.local`;
      let user = await db.users.where('email').equals(email).first();
      if (!user) {
        user = {
          id: newId(),
          email,
          passwordHash: '',
          createdAt: new Date().toISOString(),
        };
        await db.users.put(user);
      }
      const session: StoredSession = {
        id: newId(),
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      };
      await db.sessions.put(session);
      writeActiveSessionId(session.id);
    },
  };
}
