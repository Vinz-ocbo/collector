import { describe, expect, it } from 'vitest';
import { computeGuideRectInNative } from './cropImage';

type Rect = { width: number; height: number; left: number; top: number };

function fakeVideo(nativeW: number, nativeH: number, box: Rect): HTMLVideoElement {
  return {
    videoWidth: nativeW,
    videoHeight: nativeH,
    getBoundingClientRect: () => ({
      ...box,
      right: box.left + box.width,
      bottom: box.top + box.height,
      x: box.left,
      y: box.top,
      toJSON: () => box,
    }),
  } as unknown as HTMLVideoElement;
}

function fakeOverlay(box: Rect): HTMLElement {
  return {
    getBoundingClientRect: () => ({
      ...box,
      right: box.left + box.width,
      bottom: box.top + box.height,
      x: box.left,
      y: box.top,
      toJSON: () => box,
    }),
  } as unknown as HTMLElement;
}

describe('computeGuideRectInNative', () => {
  it('maps a centered overlay to the centered native rect when aspects match', () => {
    // Native 1000x1000, displayed 500x500 — same aspect ratio, no cropping.
    const video = fakeVideo(1000, 1000, { width: 500, height: 500, left: 0, top: 0 });
    // Overlay 100x100 centered at (200, 200).
    const overlay = fakeOverlay({ width: 100, height: 100, left: 200, top: 200 });
    const rect = computeGuideRectInNative(video, overlay);
    expect(rect).toEqual({ x: 400, y: 400, width: 200, height: 200 });
  });

  it('maps a portrait-viewport overlay over a landscape native frame', () => {
    // Native 1920x1080 (landscape), viewport 360x800 (portrait phone). object-cover
    // scales so height fills (scale = 800/1080 ≈ 0.7407), excess width on each side.
    const video = fakeVideo(1920, 1080, { width: 360, height: 800, left: 0, top: 0 });
    // Guide overlay: w=3/4 of viewport = 270, aspect 5:7 -> h = 270*7/5 = 378,
    // centered: x=45, y=211.
    const overlay = fakeOverlay({ width: 270, height: 378, left: 45, top: 211 });
    const rect = computeGuideRectInNative(video, overlay);
    // Expected: native x ≈ 778, y ≈ 285, w ≈ 364.5, h ≈ 510.3
    expect(rect.x).toBeCloseTo(778, 0);
    expect(rect.y).toBeCloseTo(285, 0);
    expect(rect.width).toBeCloseTo(364.5, 0);
    expect(rect.height).toBeCloseTo(510.3, 0);
    // Sanity: should sit inside the native frame.
    expect(rect.x + rect.width).toBeLessThanOrEqual(1920);
    expect(rect.y + rect.height).toBeLessThanOrEqual(1080);
  });

  it('clamps to native bounds when the overlay extends past the visible area', () => {
    // Same setup but overlay positioned at the very top — after mapping it would
    // try to land at native y < 0 if we didn't clamp.
    const video = fakeVideo(1000, 1000, { width: 500, height: 500, left: 0, top: 0 });
    const overlay = fakeOverlay({ width: 100, height: 100, left: -50, top: -50 });
    const rect = computeGuideRectInNative(video, overlay);
    expect(rect.x).toBe(0);
    expect(rect.y).toBe(0);
    // Width/height clamped to remaining bounds (and adjusted because x/y were clamped to 0).
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
  });

  it('throws when the video has no native dimensions yet', () => {
    const video = fakeVideo(0, 0, { width: 500, height: 500, left: 0, top: 0 });
    const overlay = fakeOverlay({ width: 100, height: 100, left: 0, top: 0 });
    expect(() => computeGuideRectInNative(video, overlay)).toThrow(/native dimensions/);
  });

  it('throws when the video element is not visible', () => {
    const video = fakeVideo(1000, 1000, { width: 0, height: 0, left: 0, top: 0 });
    const overlay = fakeOverlay({ width: 100, height: 100, left: 0, top: 0 });
    expect(() => computeGuideRectInNative(video, overlay)).toThrow(/visible size/);
  });
});
