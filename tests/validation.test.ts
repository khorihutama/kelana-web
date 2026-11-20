import { describe, expect, it } from 'vitest';
import { participantSchema, signInSchema, signUpSchema } from '@/lib/validation';

describe('participant validation', () => {
  const valid = {
    full_name: 'Fulan bin Fulan',
    gender: 'MALE' as const,
    phone: '+6281234567890',
    email: 'fulan@kelana.id',
  };

  it('accepts a complete participant', () => {
    expect(participantSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a phone without the +62 prefix', () => {
    const result = participantSchema.safeParse({ ...valid, phone: '08123456789' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('+62');
    }
  });

  it('rejects an empty name and a broken email', () => {
    const result = participantSchema.safeParse({ ...valid, full_name: 'Fu', email: 'nope' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toContain('full_name');
      expect(fields).toContain('email');
    }
  });
});

describe('auth validation', () => {
  it('requires a valid email and a password on sign in', () => {
    expect(signInSchema.safeParse({ email: 'fulan@kelana.id', password: 'x' }).success).toBe(true);
    expect(signInSchema.safeParse({ email: 'fulan', password: 'x' }).success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = signUpSchema.safeParse({
      name: 'Fulan',
      email: 'fulan@kelana.id',
      password: 'Password123',
      confirm: 'Password124',
      terms: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toContain('confirm');
    }
  });

  it('requires the terms checkbox', () => {
    const result = signUpSchema.safeParse({
      name: 'Fulan',
      email: 'fulan@kelana.id',
      password: 'Password123',
      confirm: 'Password123',
      terms: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toContain('terms');
      const terms = result.error.issues.find((issue) => issue.path[0] === 'terms');
      expect(terms?.message).toBe('Setujui syarat & kebijakan dulu sebelum mendaftar.');
      expect(terms?.message).not.toContain('Invalid literal value');
    }
  });

  it('accepts a consistent sign up', () => {
    const result = signUpSchema.safeParse({
      name: 'Fulan',
      email: 'fulan@kelana.id',
      password: 'Password123',
      confirm: 'Password123',
      terms: true,
    });
    expect(result.success).toBe(true);
  });
});