import { describe, expect, it } from 'vitest';
import {
  emailSchema,
  evaluatePasswordStrength,
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  signupSchema,
} from './schemas';

describe('emailSchema', () => {
  it('trims and validates', () => {
    expect(emailSchema.parse('  foo@bar.com ')).toBe('foo@bar.com');
  });

  it('rejects malformed emails', () => {
    expect(emailSchema.safeParse('foo').success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('accepts a strong password', () => {
    expect(passwordSchema.safeParse('Strong123').success).toBe(true);
  });

  it('rejects under 8 characters', () => {
    expect(passwordSchema.safeParse('Sho1').success).toBe(false);
  });

  it('rejects without a number', () => {
    expect(passwordSchema.safeParse('NoNumberHere').success).toBe(false);
  });

  it('rejects without an uppercase', () => {
    expect(passwordSchema.safeParse('nouppercase1').success).toBe(false);
  });
});

describe('evaluatePasswordStrength', () => {
  it('reports 0 for empty', () => {
    const s = evaluatePasswordStrength('');
    expect(s.score).toBe(0);
    expect(s).toMatchObject({ length: false, hasNumber: false, hasUppercase: false });
  });

  it('reports 3 for strong password', () => {
    const s = evaluatePasswordStrength('Strong123');
    expect(s.score).toBe(3);
  });

  it('reports partial scores', () => {
    expect(evaluatePasswordStrength('strong123').score).toBe(2);
    expect(evaluatePasswordStrength('Strong').score).toBe(1);
  });
});

describe('loginSchema', () => {
  it('requires both fields', () => {
    expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false);
  });

  it('accepts valid inputs', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'whatever' }).success).toBe(true);
  });
});

describe('signupSchema', () => {
  it('requires CGU to be true', () => {
    expect(
      signupSchema.safeParse({
        email: 'a@b.com',
        password: 'Strong123',
        acceptedTerms: false,
      }).success,
    ).toBe(false);
  });

  it('accepts valid signup', () => {
    expect(
      signupSchema.safeParse({
        email: 'a@b.com',
        password: 'Strong123',
        acceptedTerms: true,
      }).success,
    ).toBe(true);
  });
});

describe('forgotPasswordSchema', () => {
  it('only validates email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });
});
