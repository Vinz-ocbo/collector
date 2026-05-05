import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plus } from 'lucide-react';
import { FAB } from './FAB';

describe('FAB', () => {
  it('exposes an accessible name', () => {
    render(
      <FAB ariaLabel="Ajouter une carte">
        <Plus />
      </FAB>,
    );
    expect(screen.getByRole('button', { name: 'Ajouter une carte' })).toBeInTheDocument();
  });

  it('triggers onClick', async () => {
    const onClick = vi.fn();
    render(
      <FAB ariaLabel="x" onClick={onClick}>
        <Plus />
      </FAB>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
