import { describe, expect, it } from 'vitest';
import { cn } from '@/shared/lib';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', null, undefined, false, '', 'b')).toBe('a b');
  });

  it('merges tailwind class conflicts (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles conditional via clsx', () => {
    expect(cn('a', { b: true, c: false })).toBe('a b');
  });
});
