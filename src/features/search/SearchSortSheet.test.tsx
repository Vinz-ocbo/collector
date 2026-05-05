import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchSortSheet } from './SearchSortSheet';

describe('SearchSortSheet', () => {
  it('marks the active option as checked', () => {
    render(
      <SearchSortSheet open onOpenChange={vi.fn()} value="price-desc" onChange={vi.fn()} />,
    );
    const option = screen.getByRole('radio', { name: /prix décroissant/i });
    expect(option).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange and closes on selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <SearchSortSheet
        open
        onOpenChange={onOpenChange}
        value="relevance"
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('radio', { name: /Nom \(A→Z\)/i }));
    expect(onChange).toHaveBeenCalledWith('name-asc');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
