/**
 * Image-crop helpers for the Scan flow.
 *
 * The capture path produces the *full native frame* of the camera stream.
 * The user, however, calibrates against an overlay rectangle that only
 * covers part of that frame — so we need a way to crop down to that
 * overlay before running OCR. Three pieces:
 *
 *  - `cropToRect`            crops to an arbitrary native-coords rectangle
 *  - `cropTopFraction`       takes the top N% of an image (used for the
 *                            title region inside the card region)
 *  - `computeGuideRectInNative` maps the visible overlay (in viewport CSS
 *                            pixels, with the video scaled by `object-cover`)
 *                            to the corresponding rectangle in the native
 *                            frame. Without this, "the top 25%" of the
 *                            captured frame is the decor *above* the card,
 *                            not the title.
 */

export type ImageRect = { x: number; y: number; width: number; height: number };

export async function cropToRect(blob: Blob, rect: ImageRect): Promise<Blob> {
  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error('rect must have positive dimensions');
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(rect.width));
    canvas.height = Math.max(1, Math.floor(rect.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
    return await canvasToJpeg(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Crop the top `fraction` of an image, keeping the full width. Used for the
 * Magic title bar — when the input is already cropped to the card region,
 * a fraction around 0.18-0.20 captures the title comfortably even with
 * imperfect framing.
 */
export async function cropTopFraction(blob: Blob, fraction: number): Promise<Blob> {
  if (fraction <= 0 || fraction > 1) {
    throw new Error('fraction must be in (0, 1]');
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = Math.max(1, Math.floor(img.naturalHeight * fraction));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0);
    return await canvasToJpeg(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Map the bounding rect of an overlay element rendered above an
 * `object-cover` `<video>` to the equivalent rectangle in the native
 * camera frame. The two coordinate systems differ when the stream's
 * aspect ratio doesn't match the video element's box: `object-cover`
 * scales the stream up so it fills the box and crops the excess from
 * the larger dimension.
 *
 * The math:
 *   scale   = max(boxW / nativeW, boxH / nativeH)        // cover scale
 *   shownW  = nativeW * scale, shownH = nativeH * scale
 *   excess  = ((shownW - boxW)/2, (shownH - boxH)/2)     // cropped each side
 *   nativeX = (boxX + excessX) / scale  (and same for Y, W, H)
 *
 * Result is clamped to the native frame in case the overlay extends past
 * the video's visible area.
 */
export function computeGuideRectInNative(video: HTMLVideoElement, overlay: HTMLElement): ImageRect {
  const nativeW = video.videoWidth;
  const nativeH = video.videoHeight;
  if (!nativeW || !nativeH) {
    throw new Error('Video has no native dimensions yet');
  }
  const vRect = video.getBoundingClientRect();
  const oRect = overlay.getBoundingClientRect();
  if (vRect.width <= 0 || vRect.height <= 0) {
    throw new Error('Video element has no visible size');
  }
  const scale = Math.max(vRect.width / nativeW, vRect.height / nativeH);
  const excessX = (nativeW * scale - vRect.width) / 2;
  const excessY = (nativeH * scale - vRect.height) / 2;
  const relX = oRect.left - vRect.left;
  const relY = oRect.top - vRect.top;
  const x = (relX + excessX) / scale;
  const y = (relY + excessY) / scale;
  const width = oRect.width / scale;
  const height = oRect.height / scale;
  return clampRect({ x, y, width, height }, nativeW, nativeH);
}

function clampRect(r: ImageRect, maxW: number, maxH: number): ImageRect {
  const x = Math.max(0, Math.min(r.x, maxW));
  const y = Math.max(0, Math.min(r.y, maxH));
  const width = Math.max(1, Math.min(maxW - x, r.width));
  const height = Math.max(1, Math.min(maxH - y, r.height));
  return { x, y, width, height };
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

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/jpeg',
      0.92,
    );
  });
}
