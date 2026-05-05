import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardThumbnail } from './CardThumbnail';

const sample = {
  name: 'Lightning Bolt',
  imageUris: {
    small: 'small.jpg',
    normal: 'normal.jpg',
    large: 'large.jpg',
    png: 'large.png',
  },
};

describe('CardThumbnail', () => {
  it('uses the small image by default', () => {
    render(<CardThumbnail card={sample} />);
    const img = screen.getByRole('img', { name: 'Lightning Bolt' });
    expect(img).toHaveAttribute('src', 'small.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('honors a custom quality', () => {
    render(<CardThumbnail card={sample} quality="large" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'large.jpg');
  });

  it('accepts a custom alt for richer descriptions', () => {
    render(<CardThumbnail card={sample} alt="Lightning Bolt — instant rouge, possédée 3 fois" />);
    expect(
      screen.getByRole('img', { name: /Lightning Bolt — instant rouge, possédée 3 fois/ }),
    ).toBeInTheDocument();
  });
});
