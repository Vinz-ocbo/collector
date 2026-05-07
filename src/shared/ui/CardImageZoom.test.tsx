import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardImageZoom } from './CardImageZoom';

const card = {
  name: 'Lightning Bolt',
  imageUris: {
    small: 'https://example.test/small.png',
    normal: 'https://example.test/normal.png',
    large: 'https://example.test/large.png',
    png: 'https://example.test/full.png',
  },
};

function Controlled({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open zoom
      </button>
      <CardImageZoom open={open} onOpenChange={setOpen} card={card} />
    </>
  );
}

describe('CardImageZoom', () => {
  it('does not render the image until it is opened', () => {
    render(<Controlled />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens with the large image and the card name as accessible title', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'open zoom' }));

    const dialog = await screen.findByRole('dialog', { name: 'Lightning Bolt' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByAltText('Lightning Bolt')).toHaveAttribute(
      'src',
      'https://example.test/large.png',
    );
  });

  it('closes when the close button is pressed', async () => {
    const user = userEvent.setup();
    render(<Controlled initialOpen />);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fermer' }));
    await vi.waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
