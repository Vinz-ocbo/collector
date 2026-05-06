import type { Worker } from 'tesseract.js';

export type OcrResult = {
  /** Text recognized by Tesseract, trimmed. May be empty. */
  text: string;
  /** Confidence score 0-100, rounded. */
  confidence: number;
};

let workerPromise: Promise<Worker> | null = null;

/**
 * Tesseract is heavy (~5 MB across WASM + language data, downloaded from a
 * CDN on first use), so we keep a single worker alive across captures and
 * defer the dynamic import until OCR is actually requested. After the
 * first run the data is cached in IndexedDB by Tesseract itself, so
 * subsequent recognitions are fast.
 */
async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      return createWorker('eng');
    })();
  }
  return workerPromise;
}

export async function recognizeCardText(image: Blob): Promise<OcrResult> {
  const worker = await getWorker();
  const { data } = await worker.recognize(image);
  return {
    text: data.text.trim(),
    confidence: Math.round(data.confidence),
  };
}

/** Release the OCR worker. Call when leaving the scan flow for good. */
export async function disposeOcr(): Promise<void> {
  if (workerPromise) {
    const worker = await workerPromise;
    workerPromise = null;
    await worker.terminate();
  }
}
