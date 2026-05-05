import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AlertDialog } from './AlertDialog';

function Controlled({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
      title="Supprimer cet exemplaire"
      description="Action irréversible."
      confirmLabel="Supprimer"
      onConfirm={onConfirm}
      destructive
    />
  );
}

describe('AlertDialog', () => {
  it('renders title and description', () => {
    render(<Controlled onConfirm={() => undefined} />);
    expect(
      screen.getByRole('alertdialog', { name: 'Supprimer cet exemplaire' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Action irréversible.')).toBeInTheDocument();
  });

  it('invokes onConfirm when the destructive action is pressed', async () => {
    const onConfirm = vi.fn();
    render(<Controlled onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('closes on cancel without calling onConfirm', async () => {
    const onConfirm = vi.fn();
    render(<Controlled onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onConfirm).not.toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
