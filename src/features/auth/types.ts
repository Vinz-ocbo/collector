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
  | 'oauth_provider_not_configured'
  | 'unknown';

/**
 * OAuth providers we accept on the auth UI. Adding a new entry implies
 * (a) a button label in i18n (`auth.login.<provider>`), (b) configuration on
 * the chosen auth provider (Supabase: Authentication → Providers).
 */
export type OAuthProvider = 'google' | 'github';

export type SignInWithOAuthOptions = {
  /** Where the provider should send the user back. Defaults to the current origin. */
  redirectTo?: string;
};

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

  /**
   * Begin an OAuth flow with the given provider. The contract is *redirect-based*:
   * the implementation typically navigates the browser to the provider's
   * consent page, so this method may never resolve in production. On
   * misconfiguration (provider disabled in the dashboard, missing client id,
   * etc.) it throws AuthError('oauth_provider_not_configured' | 'unknown').
   * The dev mock implements an immediate fake sign-in instead.
   */
  signInWithOAuth(provider: OAuthProvider, options?: SignInWithOAuthOptions): Promise<void>;
};
