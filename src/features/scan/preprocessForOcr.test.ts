import { describe, expect, it } from 'vitest';
import { computeOtsuThreshold, isMostlyDark, toGrayscale } from './preprocessForOcr';

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

describe('computeOtsuThreshold', () => {
  it('finds the valley between two clearly separated populations', () => {
    // 100 dark pixels (value 30), 100 light pixels (value 200).
    // Otsu returns the upper bound of the background class — i.e. the
    // largest value still considered background. For this input that is
    // anywhere in [30, 199]: the dark pixels stay <= threshold, the light
    // pixels stay > threshold.
    const arr = new Uint8Array(200);
    arr.fill(30, 0, 100);
    arr.fill(200, 100, 200);
    const threshold = computeOtsuThreshold(arr);
    expect(threshold).toBeGreaterThanOrEqual(30);
    expect(threshold).toBeLessThan(200);
  });

  it('returns 128 fallback for an empty input', () => {
    expect(computeOtsuThreshold(new Uint8Array(0))).toBe(128);
  });

  it('handles a single-value input gracefully', () => {
    const arr = new Uint8Array(50);
    arr.fill(150);
    // No bimodal distribution, but the function must still return a sane
    // value (any of 0-255 is acceptable; we just don't want NaN/throw).
    const threshold = computeOtsuThreshold(arr);
    expect(threshold).toBeGreaterThanOrEqual(0);
    expect(threshold).toBeLessThanOrEqual(255);
  });
});

describe('isMostlyDark', () => {
  it('is true when more than half the pixels are below 128', () => {
    // 3 dark, 1 light.
    const buf = rgba([0, 0, 0], [50, 50, 50], [80, 80, 80], [200, 200, 200]);
    expect(isMostlyDark(buf)).toBe(true);
  });

  it('is false when less than half the pixels are below 128', () => {
    // 1 dark, 3 light — typical "dark text on light bg" case.
    const buf = rgba([10, 10, 10], [200, 200, 200], [220, 220, 220], [240, 240, 240]);
    expect(isMostlyDark(buf)).toBe(false);
  });

  it('is false at the boundary (exactly half)', () => {
    // 2 dark, 2 light — must NOT trigger inversion (we only invert when
    // background is clearly dark).
    const buf = rgba([0, 0, 0], [10, 10, 10], [240, 240, 240], [250, 250, 250]);
    expect(isMostlyDark(buf)).toBe(false);
  });

  it('is false on empty input', () => {
    expect(isMostlyDark(new Uint8ClampedArray(0))).toBe(false);
  });
});
