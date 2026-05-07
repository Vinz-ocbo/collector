import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScanPage } from './ScanPage';
import { Toaster } from '@/shared/ui';

vi.mock('./ocr', () => ({
  recognizeCardText: vi.fn(),
}));
vi.mock('./cropImage', () => ({
  cropTopFraction: vi.fn((blob: Blob) => Promise.resolve(blob)),
  cropToRect: vi.fn((blob: Blob) => Promise.resolve(blob)),
  computeGuideRectInNative: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
}));
vi.mock('./preprocessForOcr', () => ({
  preprocessForOcr: vi.fn((blob: Blob) => Promise.resolve(blob)),
}));

import { recognizeCardText } from './ocr';

const recognizeMock = vi.mocked(recognizeCardText);

function renderScan() {
  return render(
    <Toaster>
      <ScanPage />
    </Toaster>,
  );
}

async function uploadFile() {
  const file = new File(['(binary)'], 'card.jpg', { type: 'image/jpeg' });
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  await userEvent.upload(input as HTMLInputElement, file);
  return file;
}

beforeEach(() => {
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = vi.fn();
  }
  recognizeMock.mockReset();
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
    await uploadFile();
    expect(await screen.findByAltText(/Carte capturée/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reprendre/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reconnaître le titre/i })).toBeInTheDocument();
  });

  it('retake brings the user back to the unsupported fallback', async () => {
    renderScan();
    await screen.findByRole('heading', { name: /Pas de caméra détectée/i });
    await uploadFile();
    await userEvent.click(await screen.findByRole('button', { name: /Reprendre/i }));
    expect(
      await screen.findByRole('heading', { name: /Pas de caméra détectée/i }),
    ).toBeInTheDocument();
  });

  it('runs OCR and renders the detected text + confidence', async () => {
    recognizeMock.mockResolvedValueOnce({ text: 'Lightning Bolt', confidence: 92 });
    renderScan();
    await screen.findByRole('heading', { name: /Pas de caméra détectée/i });
    await uploadFile();
    await userEvent.click(await screen.findByRole('button', { name: /Reconnaître le titre/i }));
    expect(await screen.findByText('Lightning Bolt')).toBeInTheDocument();
    expect(screen.getByText(/Confiance\s*:\s*92/i)).toBeInTheDocument();
    expect(recognizeMock).toHaveBeenCalledOnce();
  });

  it('falls back to a placeholder when the OCR returns empty text', async () => {
    recognizeMock.mockResolvedValueOnce({ text: '', confidence: 12 });
    renderScan();
    await screen.findByRole('heading', { name: /Pas de caméra détectée/i });
    await uploadFile();
    await userEvent.click(await screen.findByRole('button', { name: /Reconnaître le titre/i }));
    expect(await screen.findByText(/Aucun texte détecté/i)).toBeInTheDocument();
  });

  it('surfaces an error UI when the OCR rejects, with a retry path', async () => {
    recognizeMock.mockRejectedValueOnce(new Error('boom'));
    renderScan();
    await screen.findByRole('heading', { name: /Pas de caméra détectée/i });
    await uploadFile();
    await userEvent.click(await screen.findByRole('button', { name: /Reconnaître le titre/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Échec de la reconnaissance/i);

    recognizeMock.mockResolvedValueOnce({ text: 'Counterspell', confidence: 88 });
    await userEvent.click(screen.getByRole('button', { name: /Réessayer/i }));
    expect(await screen.findByText('Counterspell')).toBeInTheDocument();
  });
});
