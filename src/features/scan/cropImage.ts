/**
 * Crop the top `fraction` of an image, keeping the full width. For Magic
 * cards the title bar sits in the top ~10% of the printed card, but the
 * captured frame includes the whole camera viewport — taking the top 25%
 * gives the OCR engine the title (and a bit of mana cost) without
 * dragging in the type line and oracle text.
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
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas toBlob returned null'));
        },
        'image/jpeg',
        0.92,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
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
