import { describe, expect, it } from 'vitest';
import { formatIDR, hhmmss, mmss, remainingSeconds, formatDateRange } from '@/lib/format';

describe('rupiah formatting', () => {
  it('keeps integers and uses the Rp prefix', () => {
    expect(formatIDR(850000)).toBe('Rp 850.000');
    expect(formatIDR(1700000)).toBe('Rp 1.700.000');
    expect(formatIDR(0)).toBe('Rp 0');
  });

  it('never prints decimals, even for a float input', () => {
    expect(formatIDR(1250000.6)).toBe('Rp 1.250.001');
  });
});

describe('countdown formatting', () => {
  it('renders mm:ss for the lock', () => {
    expect(mmss(900)).toBe('15:00');
    expect(mmss(59)).toBe('00:59');
    expect(mmss(-5)).toBe('00:00');
  });

  it('renders hh:mm:ss for the payment window', () => {
    expect(hhmmss(86399)).toBe('23:59:59');
    expect(hhmmss(0)).toBe('00:00:00');
  });

  it('computes remaining seconds from an ISO timestamp', () => {
    const now = Date.parse('2026-11-20T10:00:00Z');
    expect(remainingSeconds('2026-11-20T10:15:00Z', now)).toBe(900);
    expect(remainingSeconds('2026-11-20T09:00:00Z', now)).toBe(0);
    expect(remainingSeconds(undefined, now)).toBe(0);
  });
});

describe('date range', () => {
  it('collapses the month when both dates fall in it', () => {
    expect(formatDateRange('2026-12-12', '2026-12-13')).toBe('12 - 13 Des 2026');
  });
});