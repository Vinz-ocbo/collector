/**
 * Auth domain types and provider interface.
 *
 * The interface is intentionally small and provider-agnostic so it can be
 * implemented by Auth0, Clerk, Supabase, or our own backend without changes
 * to the UI layer. The mock backend in `mockBackend.ts` implements it for
 * dev / tests.
 */

export type Session = {
  userId: string;
  email: string;
  /** ISO datetime when the session expires. */
  expiresAt: string;
};

export type SignUpResult = {
  /** Whether the user must verify their email before signing in. */
  requiresVerification: boolean;
};

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'rate_limited'
  | 'email_exists'
  | 'weak_password'
  | 'unknown';

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'AuthError';
  }
}

export type AuthBackend = {
  /** Returns the current session, or null if signed out. Resolves quickly when cached. */
  getSession(): Promise<Session | null>;

  /** Sign in with email + password. Throws AuthError('invalid_credentials') on failure. */
  signInWithPassword(email: string, password: string): Promise<Session>;

  /** Create an account. Throws AuthError('email_exists' | 'weak_password'). */
  signUpWithPassword(email: string, password: string): Promise<SignUpResult>;

  /** Revoke the current session. */
  signOut(): Promise<void>;

  /** Request a password reset email. Always resolves (no leak about account existence). */
  requestPasswordReset(email: string): Promise<void>;
};
