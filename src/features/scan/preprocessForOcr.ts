/**
 * Pre-process the title-region image before handing it to Tesseract.
 *
 * Earlier versions binarised via Otsu, but that thinned out the text on
 * Magic title bars (the bilinear upscale created mid-tone edges that
 * Otsu misclassified as background) and clashed with Tesseract's own
 * internal Otsu pass — double-thresholding gave worse results than no
 * preprocessing at all.
 *
 * The current pipeline is conservative: we just make Tesseract's job
 * easier without trying to do its job for it.
 *
 *   1. 2x upscale, nearest-neighbour — gives more pixels per character
 *      (Tesseract recommends ≥30 px) without introducing anti-aliasing
 *      that softens stroke edges.
 *   2. Grayscale — drops chroma noise so the OCR engine sees only
 *      luminance, which is what its internal threshold cares about.
 *   3. Linear contrast stretch — remap the actual min/max pixel values
 *      to [0, 255]. A faded photo of "dark text on light blue" maps
 *      from e.g. (40..170) into (0..255), giving Tesseract crisp
 *      separation to threshold.
 *   4. Auto-invert based on the *original* mean luminance — for cards
 *      with dark frames (light text on dark bg), Tesseract still
 *      benefits from being handed a dark-on-light image. We use mean
 *      luminance < 96 as the trigger so a regular blue title bar
 *      (mean ~130-150 even with dark text) doesn't false-trigger.
 */

export async function preprocessForOcr(blob: Blob): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const upscale = 2;
    const w = Math.max(1, Math.floor(img.naturalWidth * upscale));
    const h = Math.max(1, Math.floor(img.naturalHeight * upscale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    // Nearest-neighbour: preserves crisp character edges. Bilinear
    // smoothing would feather strokes and mislead Tesseract.
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data;
    const grayscale = toGrayscale(pixels);
    const meanLuminance = computeMean(grayscale);
    stretchContrast(pixels, grayscale);
    if (meanLuminance < INVERT_THRESHOLD) {
      invertInPlace(pixels);
    }
    ctx.putImageData(imageData, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      // PNG: lossless. JPEG would re-introduce compression noise on the
      // text edges that we just spent effort cleaning up.
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob returned null'));
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Threshold below which we consider the image "dark frame" and invert. */
export const INVERT_THRESHOLD = 96;

/**
 * Convert RGBA pixel data to a flat array of 8-bit luminance values, one per
 * pixel. ITU-R BT.601 weights — the standard "human-perceived brightness"
 * coefficients also used by JPEG.
 */
export function toGrayscale(rgba: Uint8ClampedArray): Uint8Array {
  const out = new Uint8Array(rgba.length / 4);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
    const r = rgba[i] ?? 0;
    const g = rgba[i + 1] ?? 0;
    const b = rgba[i + 2] ?? 0;
    out[j] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return out;
}

/** Mean of a Uint8Array. Returns 0 for empty input rather than NaN. */
export function computeMean(grayscale: Uint8Array): number {
  if (grayscale.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < grayscale.length; i++) sum += grayscale[i] ?? 0;
  return sum / grayscale.length;
}

/**
 * Linear contrast stretch: read min/max from the grayscale buffer and
 * rewrite the RGBA pixels so the darkest input becomes 0 and the
 * brightest becomes 255. Identity if the input is flat (min == max).
 */
export function stretchContrast(rgba: Uint8ClampedArray, grayscale: Uint8Array): void {
  if (grayscale.length === 0) return;
  let min = 255;
  let max = 0;
  for (let i = 0; i < grayscale.length; i++) {
    const v = grayscale[i] ?? 0;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (max === min) {
    // Flat image — just write the grayscale value back into RGB so the
    // chroma channel is gone, but don't divide by zero.
    for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
      const v = grayscale[j] ?? 0;
      rgba[i] = v;
      rgba[i + 1] = v;
      rgba[i + 2] = v;
    }
    return;
  }
  const scale = 255 / (max - min);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
    const v = Math.round(((grayscale[j] ?? 0) - min) * scale);
    rgba[i] = v;
    rgba[i + 1] = v;
    rgba[i + 2] = v;
  }
}

function invertInPlace(rgba: Uint8ClampedArray): void {
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = 255 - (rgba[i] ?? 0);
    rgba[i + 1] = 255 - (rgba[i + 1] ?? 0);
    rgba[i + 2] = 255 - (rgba[i + 2] ?? 0);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error('Image load failed'));
    };
    img.src = src;
  });
}
