import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScanPage } from './ScanPage';
import { Toaster } from '@/shared/ui';

function renderScan() {
  return render(
    <Toaster>
      <ScanPage />
    </Toaster>,
  );
}

beforeEach(() => {
  // jsdom does not implement createObjectURL / revokeObjectURL.
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = vi.fn();
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ScanPage', () => {
  it('falls back to the unsupported state when getUserMedia is unavailable (jsdom)', async () => {
    renderScan();
    expect(
      await screen.findByRole('heading', { name: /Pas de caméra détectée/i }),
    ).toBeInTheDocument();
  });

  it('exposes a file picker fallback in the unsupported state', async () => {
    renderScan();
    await screen.findByRole('heading', { name: /Pas de caméra détectée/i });
    expect(screen.getByRole('button', { name: /Choisir une image/i })).toBeInTheDocument();
  });

  it('shows the captured preview after a file is selected', async () => {
    renderScan();
    await screen.findByRole('heading', { name: /Pas de caméra détectée/i });
    const file = new File(['(binary)'], 'card.jpg', { type: 'image/jpeg' });
    // The hidden input is reachable via the alt-less img query won't help here.
    // Grab it through the DOM directly — there is exactly one file input on the page.
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    await userEvent.upload(input as HTMLInputElement, file);
    expect(await screen.findByAltText(/Carte capturée/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reprendre/i })).toBeInTheDocument();
  });

  it('retake brings the user back to the unsupported fallback', async () => {
    renderScan();
    await screen.findByRole('heading', { name: /Pas de caméra détectée/i });
    const file = new File(['(binary)'], 'card.jpg', { type: 'image/jpeg' });
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    await userEvent.upload(input as HTMLInputElement, file);
    await userEvent.click(await screen.findByRole('button', { name: /Reprendre/i }));
    expect(
      await screen.findByRole('heading', { name: /Pas de caméra détectée/i }),
    ).toBeInTheDocument();
  });
});
