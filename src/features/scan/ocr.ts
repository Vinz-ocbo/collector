import type { Worker } from 'tesseract.js';

export type OcrResult = {
  /** Text recognized by Tesseract, trimmed. May be empty. */
  text: string;
  /** Confidence score 0-100, rounded. */
  confidence: number;
};

let workerPromise: Promise<Worker> | null = null;

/**
 * Tesseract is heavy (~5 MB across WASM + per-language data, downloaded
 * from a CDN on first use), so we keep a single worker alive across
 * captures and defer the dynamic import until OCR is actually requested.
 * After the first run the data is cached in IndexedDB by Tesseract itself,
 * so subsequent recognitions are fast.
 *
 * Languages: `eng` and `fra` are loaded together. Magic cards in a French
 * collection commonly include both; loading both lets Tesseract pick the
 * best fit per character without us guessing the card's printed language.
 *
 * Page-segmentation mode: SINGLE_LINE (PSM 7). The OCR input is the title
 * bar — one line of text, never a paragraph — and the default AUTO mode
 * regularly hallucinates layout, returning garbage from text-heavy
 * Tesseract heuristics that don't apply here.
 */
async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM } = await import('tesseract.js');
      const worker = await createWorker(['eng', 'fra']);
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
      });
      return worker;
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
