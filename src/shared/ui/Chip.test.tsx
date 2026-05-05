import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chip } from './Chip';

describe('Chip', () => {
  it('toggles aria-pressed when active', () => {
    render(<Chip active>Foil</Chip>);
    expect(screen.getByRole('button', { name: /Foil/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onRemove when ✕ is clicked, not the parent', async () => {
    const onRemove = vi.fn();
    const onClick = vi.fn();
    render(
      <Chip active onClick={onClick} onRemove={onRemove} removeLabel="Retirer le filtre M10">
        M10
      </Chip>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retirer le filtre M10' }));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });
});
