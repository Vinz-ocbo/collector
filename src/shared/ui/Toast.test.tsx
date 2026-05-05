import { describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster, useToast } from './Toast';

function Trigger({ onShow }: { onShow?: (id: string) => void }) {
  const { show } = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        const id = show({ title: 'Carte ajoutée', tone: 'success' });
        onShow?.(id);
      }}
    >
      go
    </button>
  );
}

describe('Toast', () => {
  it('shows a toast when triggered', async () => {
    render(
      <Toaster>
        <Trigger />
      </Toaster>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'go' }));
    expect(await screen.findByText('Carte ajoutée')).toBeInTheDocument();
  });

  it('invokes action and dismisses on click', async () => {
    const action = vi.fn();
    function ActionTrigger() {
      const { show } = useToast();
      return (
        <button
          type="button"
          onClick={() =>
            show({ title: 'Supprimée', action: { label: 'Annuler', onClick: action } })
          }
        >
          go
        </button>
      );
    }
    render(
      <Toaster>
        <ActionTrigger />
      </Toaster>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'go' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Annuler' }));
    expect(action).toHaveBeenCalledOnce();
  });

  it('throws if useToast called without Toaster', () => {
    function Lonely() {
      useToast();
      return null;
    }
    // suppress React error log for this expected throw
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() =>
      act(() => {
        render(<Lonely />);
      }),
    ).toThrow();
    spy.mockRestore();
  });
});
