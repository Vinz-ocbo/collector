import { type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { Card } from '@/shared/domain';
import { cn } from '@/shared/lib';

export type CardImageZoomProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Pick<Card, 'name' | 'imageUris'>;
  /**
   * Override the close-button accessible label. Defaults to "Fermer" — pass a
   * translated string for non-FR contexts.
   */
  closeLabel?: string;
  /**
   * Trigger element. Optional — for usage where the parent controls `open`
   * imperatively, omit and supply your own button.
   */
  trigger?: ReactNode;
};

/**
 * Fullscreen card image overlay. Closes on backdrop tap, Esc, or the
 * top-right close button. Uses the `large` image variant when available.
 *
 * Per design rule §15: never alter the image — no filters, no watermark,
 * preserve the 5:7 ratio. We just scale to fit the viewport.
 */
export function CardImageZoom({
  open,
  onOpenChange,
  card,
  closeLabel = 'Fermer',
  trigger,
}: CardImageZoomProps) {
  const src = card.imageUris.large;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn('fixed inset-0 z-50 animate-fade-in bg-bg-overlay/80')}
        />
        <DialogPrimitive.Content
          className={cn('fixed inset-0 z-50 flex items-center justify-center p-4 outline-none')}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{card.name}</DialogPrimitive.Title>
          <img
            src={src}
            alt={card.name}
            className="aspect-[5/7] max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          />
          <DialogPrimitive.Close
            aria-label={closeLabel}
            className={cn(
              'absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center',
              'rounded-full bg-bg-raised/90 text-fg shadow-md backdrop-blur',
              'hover:bg-bg-raised focus-visible:outline focus-visible:outline-2',
              'focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
