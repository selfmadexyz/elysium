import { passwordSchema, redirectSearchSchema } from '@frontend/lib/validations';
import { describe, expect, it } from 'vitest';

describe('redirectSearchSchema', () => {
  it('accepts local application paths', () => {
    expect(redirectSearchSchema.parse({ redirect: '/posts' })).toEqual({ redirect: '/posts' });
  });

  it.each([
    'https://attacker.example',
    '//attacker.example',
    '///attacker.example',
    '/\\attacker.example',
    'javascript:alert(1)',
  ])('rejects an external redirect: %s', (redirect) => {
    expect(() => redirectSearchSchema.parse({ redirect })).toThrow();
  });
});

describe('passwordSchema', () => {
  it('allows passphrases containing spaces', () => {
    expect(passwordSchema.parse('correct horse battery staple')).toBe('correct horse battery staple');
  });
});
