import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib';

const PULL_THRESHOLD = 80;
const RESISTANCE = 0.5;

export type PullToRefreshProps = {
  onRefresh: () => Promise<unknown> | void;
  children: ReactNode;
  /**
   * Disable the gesture entirely (e.g. while a modal is open). The container
   * still mounts so children stay stable; only the touch handlers are gated.
   */
  disabled?: boolean;
  /** Accessible label for the indicator. */
  label?: string;
};

/**
 * Pull-to-refresh wrapper. Touch-only (mouse users wouldn't expect this
 * gesture on web). Triggers `onRefresh` once the pull crosses the threshold
 * and the user releases. The indicator translates with the pull and pins
 * while the refresh is in flight.
 *
 * Body-level `overscroll-behavior-y: contain` (set in index.css) keeps the
 * browser from competing with us via its native pull-to-reload.
 */
export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  label = 'Tirer pour rafraîchir',
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const refreshingRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (disabled) return;
    const container = containerRef.current;
    if (!container) return;

    function onTouchStart(event: TouchEvent) {
      if (window.scrollY > 0 || refreshingRef.current) {
        startYRef.current = null;
        return;
      }
      const touch = event.touches[0];
      if (!touch) return;
      startYRef.current = touch.clientY;
    }

    function onTouchMove(event: TouchEvent) {
      if (startYRef.current === null) return;
      const touch = event.touches[0];
      if (!touch) return;
      const delta = touch.clientY - startYRef.current;
      if (delta <= 0) {
        // User scrolled up — abandon the gesture.
        startYRef.current = null;
        if (offsetRef.current !== 0) {
          offsetRef.current = 0;
          setOffset(0);
        }
        return;
      }
      // Block the document scroll so the page doesn't drift while pulling.
      event.preventDefault();
      const next = Math.min(delta * RESISTANCE, PULL_THRESHOLD * 1.6);
      offsetRef.current = next;
      setOffset(next);
    }

    function reset() {
      startYRef.current = null;
      offsetRef.current = 0;
      setOffset(0);
    }

    function onTouchEnd() {
      if (startYRef.current === null) return;
      const passed = offsetRef.current >= PULL_THRESHOLD;
      if (passed && !refreshingRef.current) {
        refreshingRef.current = true;
        setIsRefreshing(true);
        // Pin the indicator at threshold height while refreshing.
        offsetRef.current = PULL_THRESHOLD;
        setOffset(PULL_THRESHOLD);
        startYRef.current = null;
        void Promise.resolve(onRefresh()).finally(() => {
          refreshingRef.current = false;
          setIsRefreshing(false);
          offsetRef.current = 0;
          setOffset(0);
        });
      } else {
        reset();
      }
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', reset);
    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', reset);
    };
  }, [disabled, onRefresh]);

  const showIndicator = offset > 0 || isRefreshing;
  const progress = Math.min(offset / PULL_THRESHOLD, 1);

  return (
    <div ref={containerRef} className="relative">
      {showIndicator ? (
        <div
          role="status"
          aria-live="polite"
          aria-label={label}
          className={cn(
            'pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 transition-opacity',
            'flex h-10 w-10 items-center justify-center rounded-full bg-bg-raised text-accent shadow-md',
          )}
          style={{
            top: 8,
            transform: `translate(-50%, ${offset - 48}px)`,
            opacity: Math.max(progress, isRefreshing ? 1 : 0),
          }}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw
              className="h-5 w-5"
              aria-hidden="true"
              style={{ transform: `rotate(${progress * 360}deg)` }}
            />
          )}
        </div>
      ) : null}
      <div
        style={
          offset > 0 || isRefreshing
            ? { transform: `translateY(${offset}px)`, transition: isRefreshing ? 'none' : undefined }
            : { transition: 'transform 200ms ease-out' }
        }
      >
        {children}
      </div>
    </div>
  );
}
