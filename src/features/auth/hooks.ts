import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthBackend } from './AuthBackendProvider';
import type { Session, SignUpResult } from './types';

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
