export { AuthBackendProvider, useAuthBackend } from './AuthBackendProvider';
export {
  useSession,
  useSignIn,
  useSignUp,
  useSignOut,
  useRequestPasswordReset,
  useSignInWithOAuth,
} from './hooks';
export { RequireAuth } from './RequireAuth';
export { AuthLayout } from './AuthLayout';
export { LoginPage } from './LoginPage';
export { SignupPage } from './SignupPage';
export { ForgotPasswordPage } from './ForgotPasswordPage';
export { createMockAuthBackend } from './mockBackend';
export { createSupabaseAuthBackend, type SupabaseAuthBackendOptions } from './supabaseBackend';
export {
  AuthError,
  type Session,
  type AuthBackend,
  type AuthErrorCode,
  type OAuthProvider,
  type SignInWithOAuthOptions,
} from './types';
