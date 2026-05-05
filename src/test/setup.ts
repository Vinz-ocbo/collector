import '@testing-library/jest-dom/vitest';
import { i18n } from '@/i18n';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Tests assert against French strings; force FR regardless of jsdom's
// navigator.language (which is typically en-US).
void i18n.changeLanguage('fr');

afterEach(() => {
  cleanup();
});

// jsdom polyfills for Radix UI
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  if (!('ResizeObserver' in window)) {
    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      })),
    });
  }

  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn();
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }

  // Vaul reads style.transform / webkitTransform / mozTransform during drag;
  // jsdom returns undefined for the vendor-prefixed ones, which crashes Vaul
  // even when we never actually drag. Stub them to empty strings.
  const styleProto = Object.getPrototypeOf(
    document.documentElement.style,
  ) as CSSStyleDeclaration;
  for (const prop of ['webkitTransform', 'mozTransform'] as const) {
    if (!(prop in styleProto)) {
      Object.defineProperty(styleProto, prop, {
        configurable: true,
        get() {
          return '';
        },
        set() {
          /* no-op */
        },
      });
    }
  }
}
