import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import type { CardSet } from '@/shared/domain';
import { SearchBackendProvider } from './SearchBackendProvider';
import { SearchFiltersSheet } from './SearchFiltersSheet';
import type { SearchBackend } from './types';

const SETS: CardSet[] = [
  {
    id: 's1',
    game: 'magic',
    code: 'm21',
    name: 'Core Set 2021',
    setType: 'core',
    cardCount: 0,
    digital: false,
    iconSvgUri: '',
  },
  {
    id: 's2',
    game: 'magic',
    code: 'znr',
    name: 'Zendikar Rising',
    setType: 'expansion',
    cardCount: 0,
    digital: false,
    iconSvgUri: '',
  },
];

function makeBackend(): SearchBackend {
  return {
    searchCards: vi.fn().mockResolvedValue({ cards: [], total: 0 }),
    getCardById: vi.fn().mockResolvedValue(null),
    getCardRulings: vi.fn().mockResolvedValue([]),
    getSets: vi.fn().mockResolvedValue(SETS),
  };
}

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return (
    <QueryClientProvider client={qc}>
      <SearchBackendProvider backend={makeBackend()}>{children}</SearchBackendProvider>
    </QueryClientProvider>
  );
}

describe('SearchFiltersSheet', () => {
  it('toggles a color chip and applies the draft', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onOpenChange = vi.fn();
    render(<SearchFiltersSheet open onOpenChange={onOpenChange} filter={{}} onApply={onApply} />, {
      wrapper: Wrapper,
    });

    await user.click(screen.getByRole('button', { name: /^Rouge$/i }));
    await user.click(screen.getByRole('button', { name: /^Appliquer$/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ colors: ['R'] }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('resets the draft to empty when "Réinitialiser" is clicked', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(
      <SearchFiltersSheet
        open
        onOpenChange={vi.fn()}
        filter={{ colors: ['R'], rarities: ['rare'], hideOwned: true }}
        onApply={onApply}
      />,
      { wrapper: Wrapper },
    );

    await user.click(screen.getByRole('button', { name: /Réinitialiser/i }));
    await user.click(screen.getByRole('button', { name: /^Appliquer$/i }));
    expect(onApply).toHaveBeenCalledWith({});
  });

  it('lists sets returned by the backend and lets the user toggle one', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<SearchFiltersSheet open onOpenChange={vi.fn()} filter={{}} onApply={onApply} />, {
      wrapper: Wrapper,
    });

    // Wait for sets list to load (TanStack Query is async even with mocked data)
    const setRow = await screen.findByRole('checkbox', { name: /Zendikar Rising/i });
    await user.click(setRow);
    await user.click(screen.getByRole('button', { name: /^Appliquer$/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ setCodes: ['znr'] }));
  });

  it('filters the set list by the search query', async () => {
    const user = userEvent.setup();
    render(<SearchFiltersSheet open onOpenChange={vi.fn()} filter={{}} onApply={vi.fn()} />, {
      wrapper: Wrapper,
    });

    // Wait for sets list to populate
    await screen.findByRole('checkbox', { name: /Zendikar Rising/i });
    const search = screen.getByRole('searchbox', { name: /Rechercher un set/i });
    await user.type(search, 'zen');

    const list = screen.getByRole('checkbox', { name: /Zendikar Rising/i }).closest('ul');
    expect(list).not.toBeNull();
    const items = within(list as HTMLElement).getAllByRole('checkbox');
    expect(items).toHaveLength(1);
  });

  it('toggles the hideOwned switch', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<SearchFiltersSheet open onOpenChange={vi.fn()} filter={{}} onApply={onApply} />, {
      wrapper: Wrapper,
    });

    await user.click(screen.getByRole('switch', { name: /Masquer/i }));
    await user.click(screen.getByRole('button', { name: /^Appliquer$/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ hideOwned: true }));
  });
});
