import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Ajouter</Button>);
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
  });

  it('defaults to type=button to avoid accidental form submits', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('triggers onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('respects disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Off
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards as a link via asChild', () => {
    render(
      <Button asChild>
        <a href="/somewhere">Lien</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Lien' });
    expect(link).toHaveAttribute('href', '/somewhere');
  });

  it('applies destructive variant classes', () => {
    render(<Button variant="destructive">Supprimer</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger');
  });
});
