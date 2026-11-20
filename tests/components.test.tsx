import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import { TimerChip } from '@/components/Timer';
import { Badge, EmptyState } from '@/components/ui';

describe('TimerChip', () => {
  it('counts down and turns red under a minute', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-20T10:00:00Z'));
    render(<TimerChip expiresAt="2026-11-20T10:15:00Z" kind="LOCK" />);
    expect(screen.getByRole('timer')).toHaveTextContent('15:00');

    act(() => {
      vi.advanceTimersByTime(14 * 60 * 1000 + 30 * 1000);
    });
    expect(screen.getByRole('timer')).toHaveTextContent('00:30');
    expect(screen.getByRole('timer').className).toContain('text-danger');
    vi.useRealTimers();
  });

  it('shows hh:mm:ss for the payment window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-20T10:00:00Z'));
    render(<TimerChip expiresAt="2026-11-21T09:59:59Z" kind="PAYMENT" />);
    expect(screen.getByRole('timer')).toHaveTextContent('23:59:59');
    vi.useRealTimers();
  });
});

describe('shared blocks', () => {
  it('renders an empty state with its copy', () => {
    render(
      <EmptyState
        title="Belum ada Open Trip saat ini"
        description="Tim Kelana sedang menyiapkan rute & jadwal Open Trip."
      />,
    );
    expect(screen.getByText('Belum ada Open Trip saat ini')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('renders a badge', () => {
    render(<Badge tone="brand">Siap Berangkat</Badge>);
    expect(screen.getByText('Siap Berangkat')).toHaveClass('bg-mint');
  });
});