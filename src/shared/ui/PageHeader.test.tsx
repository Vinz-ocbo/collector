import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders title as H1', () => {
    render(<PageHeader title="Ma collection" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Ma collection' })).toBeInTheDocument();
  });

  it('shows back button when onBack is provided', async () => {
    const onBack = vi.fn();
    render(<PageHeader title="x" onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retour' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('omits back button without onBack', () => {
    render(<PageHeader title="x" />);
    expect(screen.queryByRole('button', { name: 'Retour' })).not.toBeInTheDocument();
  });
});
