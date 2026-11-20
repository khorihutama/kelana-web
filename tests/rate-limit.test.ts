import { describe, expect, it } from 'vitest';
import { ApiError, rateLimitWaitMessage } from '@/lib/api';

function rateLimited(retryAfterSeconds?: number) {
  return new ApiError(
    429,
    'RATE_LIMITED',
    'Terlalu banyak percobaan. Coba lagi nanti.',
    undefined,
    undefined,
    retryAfterSeconds,
  );
}

describe('rate limit wait message', () => {
  it('uses the Retry-After minutes', () => {
    expect(rateLimitWaitMessage(rateLimited(600))).toBe('Coba lagi dalam 10 menit.');
  });

  it('rounds seconds up', () => {
    expect(rateLimitWaitMessage(rateLimited(45))).toBe('Coba lagi dalam 45 detik.');
  });

  it('uses hours for long waits', () => {
    expect(rateLimitWaitMessage(rateLimited(3661))).toBe('Coba lagi dalam 2 jam.');
  });

  it('falls back when the header is missing', () => {
    expect(rateLimitWaitMessage(rateLimited())).toBe('Terlalu banyak percobaan. Coba lagi nanti.');
  });

  it('ignores other errors', () => {
    expect(rateLimitWaitMessage(new ApiError(400, 'VALIDATION_ERROR', 'Data tidak valid'))).toBeUndefined();
    expect(rateLimitWaitMessage(new Error('network'))).toBeUndefined();
  });
});