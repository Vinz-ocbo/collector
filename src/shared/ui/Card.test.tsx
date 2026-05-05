import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Lightning Bolt</Card>);
    expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
  });

  it('applies raised elevation classes', () => {
    const { container } = render(<Card elevation="raised">x</Card>);
    expect(container.firstElementChild).toHaveClass('shadow-sm');
  });
});
