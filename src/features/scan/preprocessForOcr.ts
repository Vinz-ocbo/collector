/**
 * Pre-process the title-region image before handing it to Tesseract.
 *
 * Pipeline (in order):
 *   1. 2x upscale  — gives Tesseract more pixels per character. The recommended
 *                    height for reliable OCR is ≥30 px per character; the
 *                    captured title region often comes in below that on
 *                    smaller phone resolutions. Bilinear is enabled.
 *   2. Grayscale   — drops the colour channel so brightness is the only signal.
 *   3. Otsu binarize — picks an optimal black/white threshold from the
 *                    histogram. Removes JPEG noise, lifts contrast to 100%,
 *                    and produces the high-contrast input Tesseract was
 *                    trained on.
 *   4. Auto-invert — Tesseract expects dark text on a light background. After
 *                    Otsu, we count black pixels vs total; if the majority
 *                    are black (i.e. the *background* is dark), we invert.
 *                    This is more robust than relying on the original mean
 *                    luminance because pure-blue title bars are dark in RGB
 *                    luminance terms even though their text is dark too.
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
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data;
    const grayscale = toGrayscale(pixels);
    const threshold = computeOtsuThreshold(grayscale);
    binarize(pixels, grayscale, threshold);
    if (isMostlyDark(pixels)) {
      invert(pixels);
    }
    ctx.putImageData(imageData, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      // PNG output: the image is now pure black/white, JPEG would re-introduce
      // compression artefacts at exactly the edges Tesseract relies on.
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob returned null'));
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

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

/**
 * Otsu's method: pick the threshold that maximises the between-class variance
 * of foreground vs background pixels. Standard reference algorithm — runs in
 * O(256) over the histogram.
 */
export function computeOtsuThreshold(grayscale: Uint8Array): number {
  const histogram = new Array<number>(256).fill(0);
  for (let i = 0; i < grayscale.length; i++) {
    histogram[grayscale[i] ?? 0]!++;
  }
  const total = grayscale.length;
  if (total === 0) return 128;
  let sumTotal = 0;
  for (let i = 0; i < 256; i++) sumTotal += i * (histogram[i] ?? 0);
  let sumB = 0;
  let weightB = 0;
  let maxVariance = -1;
  let threshold = 128;
  for (let i = 0; i < 256; i++) {
    const count = histogram[i] ?? 0;
    weightB += count;
    if (weightB === 0) continue;
    const weightF = total - weightB;
    if (weightF === 0) break;
    sumB += i * count;
    const meanB = sumB / weightB;
    const meanF = (sumTotal - sumB) / weightF;
    const variance = weightB * weightF * (meanB - meanF) * (meanB - meanF);
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }
  return threshold;
}

/**
 * Apply the threshold to the grayscale buffer and write the binary result
 * back into the RGBA pixel data (R=G=B=value, A unchanged).
 */
function binarize(rgba: Uint8ClampedArray, grayscale: Uint8Array, threshold: number): void {
  // Strictly greater than the threshold → foreground (white). Otsu's loop
  // accumulates `weightB` *after* including pixels equal to the current
  // intensity, so the returned T is the upper bound of the background class:
  // pixels with value <= T are background, pixels > T are foreground.
  for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
    const value = (grayscale[j] ?? 0) > threshold ? 255 : 0;
    rgba[i] = value;
    rgba[i + 1] = value;
    rgba[i + 2] = value;
  }
}

/**
 * Decide whether the binary image is "background dark, text light" — in which
 * case Tesseract will fail and we must invert. Heuristic: in a typical
 * scanned page, the background dominates pixel count and the text is the
 * minority. So if more than half the pixels are black, the background is
 * black → we have light text on dark background.
 */
export function isMostlyDark(rgba: Uint8ClampedArray): boolean {
  let dark = 0;
  let total = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    if ((rgba[i] ?? 0) < 128) dark++;
    total++;
  }
  return total > 0 && dark > total / 2;
}

function invert(rgba: Uint8ClampedArray): void {
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
