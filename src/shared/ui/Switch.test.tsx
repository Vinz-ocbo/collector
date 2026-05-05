import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';

describe('Switch', () => {
  it('exposes a checkbox-like switch role', () => {
    render(<Switch aria-label="Foil" />);
    expect(screen.getByRole('switch', { name: 'Foil' })).toBeInTheDocument();
  });

  it('toggles when clicked', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Foil" onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('respects controlled checked state', () => {
    render(<Switch aria-label="Foil" checked />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
});
