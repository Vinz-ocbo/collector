/**
 * Supabase implementation of the AuthBackend interface.
 *
 * Lazily wires the official @supabase/supabase-js client when configured.
 * The mock backend stays the dev default; this one is selected when both
 * `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in the env.
 *
 * Provider-agnostic — the rest of the app never imports `@supabase/...`
 * directly. Swapping to Auth0/Clerk later means writing another file like
 * this one.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  AuthError,
  type AuthBackend,
  type OAuthProvider,
  type Session,
  type SignInWithOAuthOptions,
  type SignUpResult,
} from './types';

export type SupabaseAuthBackendOptions = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** Override for tests. Defaults to a real Supabase client. */
  client?: SupabaseClient;
};

export function createSupabaseAuthBackend(opts: SupabaseAuthBackendOptions): AuthBackend {
  const client =
    opts.client ??
    createClient(opts.supabaseUrl, opts.supabaseAnonKey, {
      auth: {
        // Persist the session in localStorage so a reload keeps the user
        // signed in. Supabase's default; spelled out for clarity.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

  return {
    async getSession(): Promise<Session | null> {
      const { data, error } = await client.auth.getSession();
      if (error) throw mapError(error);
      const session = data.session;
      if (!session?.user.email) return null;
      return {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
      };
    },

    async signInWithPassword(email, password): Promise<Session> {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw mapError(error);
      const session = data.session;
      if (!session?.user.email) throw new AuthError('unknown', 'No session returned');
      return {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
      };
    },

    async signUpWithPassword(email, password): Promise<SignUpResult> {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw mapError(error);
      // When email confirmations are required by the project, `session` is
      // null and the user lands an email. When disabled, we get a session
      // back immediately and the UI can sign in straight away.
      return { requiresVerification: data.session === null };
    },

    async signOut(): Promise<void> {
      const { error } = await client.auth.signOut();
      if (error) throw mapError(error);
    },

    async requestPasswordReset(email): Promise<void> {
      const { error } = await client.auth.resetPasswordForEmail(email);
      if (error) throw mapError(error);
    },

    async signInWithOAuth(
      provider: OAuthProvider,
      options: SignInWithOAuthOptions = {},
    ): Promise<void> {
      // Supabase JS triggers a full-page redirect to the provider, so under
      // normal circumstances this method never resolves — the page unloads
      // before the promise settles. We still await/throw so configuration
      // errors (provider disabled, missing keys) surface as AuthError.
      const redirectTo =
        options.redirectTo ??
        (typeof window !== 'undefined' ? `${window.location.origin}/` : undefined);
      const { error } = await client.auth.signInWithOAuth({
        provider,
        ...(redirectTo ? { options: { redirectTo } } : {}),
      });
      if (error) throw mapError(error);
    },
  };
}

/**
 * Maps Supabase's loose error shape onto our AuthError codes. Supabase
 * returns a `code` field on AuthApiError plus `status`; both feed into the
 * mapping. Anything we don't recognise falls through to 'unknown'.
 */
function mapError(error: {
  code?: string | undefined;
  message?: string | undefined;
  status?: number | undefined;
}): AuthError {
  const code = error.code;
  const message = error.message ?? 'Unknown auth error';

  if (code === 'invalid_credentials' || code === 'invalid_grant') {
    return new AuthError('invalid_credentials', message);
  }
  if (code === 'user_already_exists' || code === 'email_exists') {
    return new AuthError('email_exists', message);
  }
  if (code === 'weak_password') {
    return new AuthError('weak_password', message);
  }
  if (
    code === 'provider_disabled' ||
    code === 'oauth_provider_not_supported' ||
    code === 'validation_failed'
  ) {
    return new AuthError('oauth_provider_not_configured', message);
  }
  if (error.status === 429) {
    return new AuthError('rate_limited', message);
  }
  return new AuthError('unknown', message);
}
