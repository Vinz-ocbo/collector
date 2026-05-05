import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Stepper } from './Stepper';

function Controlled(props: { initial: number; min?: number; max?: number }) {
  const [value, setValue] = useState(props.initial);
  return (
    <Stepper
      value={value}
      onChange={setValue}
      ariaLabel="Quantité"
      min={props.min}
      max={props.max}
    />
  );
}

describe('Stepper', () => {
  it('exposes the group label', () => {
    render(<Controlled initial={1} />);
    expect(screen.getByRole('group', { name: 'Quantité' })).toBeInTheDocument();
  });

  it('increments and decrements', async () => {
    render(<Controlled initial={3} />);
    await userEvent.click(screen.getByRole('button', { name: 'Augmenter' }));
    expect(screen.getByRole('spinbutton', { name: /Quantité/i })).toHaveValue(4);
    await userEvent.click(screen.getByRole('button', { name: 'Diminuer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Diminuer' }));
    expect(screen.getByRole('spinbutton')).toHaveValue(2);
  });

  it('disables decrement at min', () => {
    render(<Controlled initial={1} min={1} />);
    expect(screen.getByRole('button', { name: 'Diminuer' })).toBeDisabled();
  });

  it('disables increment at max', () => {
    render(<Controlled initial={5} max={5} />);
    expect(screen.getByRole('button', { name: 'Augmenter' })).toBeDisabled();
  });

  it('clamps direct input within bounds', async () => {
    const onChange = vi.fn();
    render(<Stepper value={3} onChange={onChange} ariaLabel="X" min={1} max={5} />);
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '99');
    // last call should be clamped to 5
    expect(onChange).toHaveBeenLastCalledWith(5);
  });
});
