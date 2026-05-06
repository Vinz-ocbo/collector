import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthBackend } from './AuthBackendProvider';
import type { OAuthProvider, Session, SignInWithOAuthOptions, SignUpResult } from './types';

const SESSION_KEY = ['auth', 'session'] as const;

export function useSession() {
  const backend = useAuthBackend();
  return useQuery<Session | null>({
    queryKey: SESSION_KEY,
    queryFn: () => backend.getSession(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useSignIn() {
  const backend = useAuthBackend();
  const qc = useQueryClient();
  return useMutation<Session, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => backend.signInWithPassword(email, password),
    onSuccess: (session) => {
      qc.setQueryData<Session | null>(SESSION_KEY, session);
    },
  });
}

export function useSignUp() {
  const backend = useAuthBackend();
  return useMutation<SignUpResult, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => backend.signUpWithPassword(email, password),
  });
}

export function useSignOut() {
  const backend = useAuthBackend();
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => backend.signOut(),
    onSuccess: () => {
      qc.setQueryData<Session | null>(SESSION_KEY, null);
      // Wipe non-auth caches so the next user does not see stale data.
      qc.removeQueries({
        predicate: (query) => {
          const [head] = query.queryKey;
          return head !== 'auth';
        },
      });
    },
  });
}

export function useRequestPasswordReset() {
  const backend = useAuthBackend();
  return useMutation<void, Error, { email: string }>({
    mutationFn: ({ email }) => backend.requestPasswordReset(email),
  });
}

export function useSignInWithOAuth() {
  const backend = useAuthBackend();
  const qc = useQueryClient();
  return useMutation<void, Error, { provider: OAuthProvider; options?: SignInWithOAuthOptions }>({
    mutationFn: ({ provider, options }) => backend.signInWithOAuth(provider, options),
    onSuccess: () => {
      // The Supabase backend triggers a redirect that unloads the page, so
      // this rarely fires in production. The dev mock signs in immediately,
      // and the cache invalidation lets useSession refetch the new session.
      void qc.invalidateQueries({ queryKey: SESSION_KEY });
    },
  });
}
