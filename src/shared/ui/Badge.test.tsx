import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its content', () => {
    render(<Badge>×3</Badge>);
    expect(screen.getByText('×3')).toBeInTheDocument();
  });

  it('applies tone variant classes', () => {
    render(<Badge tone="success">NM</Badge>);
    expect(screen.getByText('NM')).toHaveClass('text-success');
  });
});
