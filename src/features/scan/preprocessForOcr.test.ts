import { describe, expect, it } from 'vitest';
import { computeMean, stretchContrast, toGrayscale } from './preprocessForOcr';

function rgba(...pixels: number[][]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach((p, i) => {
    out[i * 4] = p[0] ?? 0;
    out[i * 4 + 1] = p[1] ?? 0;
    out[i * 4 + 2] = p[2] ?? 0;
    out[i * 4 + 3] = p[3] ?? 255;
  });
  return out;
}

describe('toGrayscale', () => {
  it('uses BT.601 luminance weights', () => {
    // Pure red → 0.299 * 255 = 76.245 → 76
    // Pure green → 0.587 * 255 = 149.685 → 150
    // Pure blue → 0.114 * 255 = 29.07 → 29
    const out = toGrayscale(rgba([255, 0, 0], [0, 255, 0], [0, 0, 255]));
    expect(out[0]).toBe(76);
    expect(out[1]).toBe(150);
    expect(out[2]).toBe(29);
  });

  it('maps black to 0 and white to 255', () => {
    const out = toGrayscale(rgba([0, 0, 0], [255, 255, 255]));
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(255);
  });
});

describe('computeMean', () => {
  it('returns the arithmetic mean of the grayscale buffer', () => {
    const arr = new Uint8Array([10, 20, 30, 40]);
    expect(computeMean(arr)).toBe(25);
  });

  it('returns 0 for an empty buffer (no NaN)', () => {
    expect(computeMean(new Uint8Array(0))).toBe(0);
  });
});

describe('stretchContrast', () => {
  it('remaps the darkest input to 0 and the brightest to 255', () => {
    // Three pixels with grayscale values 50, 100, 200 → after stretch should
    // span the full 0..255 range. Pixels themselves can be anything in RGB
    // since stretch is driven by the grayscale buffer.
    const pixels = rgba([0, 0, 0], [0, 0, 0], [0, 0, 0]);
    const gray = new Uint8Array([50, 100, 200]);
    stretchContrast(pixels, gray);
    expect(pixels[0]).toBe(0); // (50 - 50) * 255 / 150 = 0
    expect(pixels[4]).toBe(85); // (100 - 50) * 255 / 150 = 85
    expect(pixels[8]).toBe(255); // (200 - 50) * 255 / 150 = 255
  });

  it('handles a flat image without dividing by zero', () => {
    const pixels = rgba([0, 0, 0], [0, 0, 0]);
    const gray = new Uint8Array([128, 128]);
    stretchContrast(pixels, gray);
    // No stretch possible; we just write the grayscale value back.
    expect(pixels[0]).toBe(128);
    expect(pixels[4]).toBe(128);
  });

  it('writes the same value to R, G and B (and leaves alpha alone)', () => {
    const pixels = rgba([10, 20, 30, 200]);
    const gray = new Uint8Array([100]);
    stretchContrast(pixels, gray);
    expect(pixels[0]).toBe(pixels[1]);
    expect(pixels[1]).toBe(pixels[2]);
    expect(pixels[3]).toBe(200); // alpha untouched
  });

  it('is a no-op on empty input', () => {
    const pixels = new Uint8ClampedArray(0);
    const gray = new Uint8Array(0);
    expect(() => stretchContrast(pixels, gray)).not.toThrow();
  });
});
