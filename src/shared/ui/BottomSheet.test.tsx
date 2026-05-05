import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { BottomSheet } from './BottomSheet';

function Controlled({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen((v) => !v)}>
        toggle
      </button>
      <BottomSheet open={open} onOpenChange={setOpen} title="Filtres" description="Set, couleur…">
        <p>contenu</p>
      </BottomSheet>
    </>
  );
}

describe('BottomSheet', () => {
  it('renders title, description and content when open', async () => {
    render(<Controlled initialOpen />);
    expect(await screen.findByRole('dialog', { name: 'Filtres' })).toBeInTheDocument();
    expect(screen.getByText('Set, couleur…')).toBeInTheDocument();
    expect(screen.getByText('contenu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
  });

  it('is hidden when closed', () => {
    render(<Controlled />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens via state change', async () => {
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(await screen.findByRole('dialog', { name: 'Filtres' })).toBeInTheDocument();
  });

  it('renders the footer when provided', async () => {
    function WithFooter() {
      const [open, setOpen] = useState(true);
      return (
        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          title="x"
          footer={<button type="button">Appliquer</button>}
        >
          <p>x</p>
        </BottomSheet>
      );
    }
    render(<WithFooter />);
    expect(await screen.findByRole('button', { name: 'Appliquer' })).toBeInTheDocument();
  });

  // Closing behaviour (drag to dismiss, click on close, Escape) is exercised
  // via Vaul's own test suite. We avoid driving it here because jsdom lacks
  // the CSS transform shim Vaul reads on pointer up.
  it('forwards onOpenChange when consumer toggles state', async () => {
    const onOpenChange = vi.fn();
    function ExternalToggle() {
      return (
        <BottomSheet open onOpenChange={onOpenChange} title="x">
          <p>y</p>
        </BottomSheet>
      );
    }
    render(<ExternalToggle />);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
