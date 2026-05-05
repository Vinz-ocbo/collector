import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders an editable text input by default', async () => {
    render(<Input aria-label="Nom" />);
    const input = screen.getByRole('textbox', { name: 'Nom' });
    await userEvent.type(input, 'Lightning');
    expect(input).toHaveValue('Lightning');
  });

  it('marks aria-invalid when invalid', () => {
    render(<Input aria-label="Email" invalid />);
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('respects disabled', async () => {
    render(<Input aria-label="X" disabled />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'a');
    expect(input).toHaveValue('');
  });

  it('renders as type=search when requested', () => {
    render(<Input aria-label="q" type="search" />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });
});
