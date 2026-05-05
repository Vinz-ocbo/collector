import { z } from 'zod';

/**
 * Validation messages are i18n keys. Form components run them through `t()`
 * before display. This keeps schemas pure (loaded once at module init) while
 * still letting the user switch language at runtime.
 */

export const emailSchema = z.string().trim().email('auth.schemas.emailInvalid');

/**
 * Password rules per design spec (auth.md #3):
 *  - 8 caractères minimum
 *  - au moins 1 chiffre
 *  - au moins 1 majuscule
 */
export const passwordSchema = z
  .string()
  .min(8, 'auth.schemas.passwordMinLength')
  .regex(/[0-9]/, 'auth.schemas.passwordNumber')
  .regex(/[A-Z]/, 'auth.schemas.passwordUppercase');

export type PasswordStrength = {
  length: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
  /** 0–3, count of satisfied rules. */
  score: number;
};

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const length = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  return {
    length,
    hasNumber,
    hasUppercase,
    score: [length, hasNumber, hasUppercase].filter(Boolean).length,
  };
}

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'auth.schemas.passwordRequired'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'auth.schemas.termsRequired' }),
  }),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
