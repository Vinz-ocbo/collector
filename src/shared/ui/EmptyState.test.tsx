import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';
import { Button } from './Button';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="Pas encore de cartes" description="Ajoutez la première." />);
    expect(screen.getByRole('heading', { name: 'Pas encore de cartes' })).toBeInTheDocument();
    expect(screen.getByText('Ajoutez la première.')).toBeInTheDocument();
  });

  it('renders action slot', () => {
    render(<EmptyState title="Vide" action={<Button>Ajouter</Button>} />);
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
  });
});
