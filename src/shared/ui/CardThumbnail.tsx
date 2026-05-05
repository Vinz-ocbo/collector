import { forwardRef, useState, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { Card } from '@/shared/domain';
import { cn } from '@/shared/lib';

export const cardThumbnailVariants = cva('relative block overflow-hidden rounded-md bg-fg/5', {
  variants: {
    size: {
      // Card aspect ratio is ~5:7. Width controls the size; height follows.
      xs: 'w-10',
      sm: 'w-16',
      md: 'w-24',
      lg: 'w-40',
      full: 'w-full',
    },
  },
  defaultVariants: { size: 'md' },
});

export type CardThumbnailProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardThumbnailVariants> & {
    card: Pick<Card, 'name' | 'imageUris'>;
    /** Image quality. Defaults to 'small' which is faster on lists. */
    quality?: 'small' | 'normal' | 'large';
    /** Override the alt text (defaults to the card name). */
    alt?: string;
  };

export const CardThumbnail = forwardRef<HTMLDivElement, CardThumbnailProps>(
  ({ className, size, card, quality = 'small', alt, ...props }, ref) => {
    const [loaded, setLoaded] = useState(false);
    const src = card.imageUris[quality] ?? card.imageUris.normal;

    return (
      <div ref={ref} className={cn(cardThumbnailVariants({ size }), className)} {...props}>
        <div className="aspect-[5/7] w-full">
          <img
            src={src}
            alt={alt ?? card.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-fast',
              loaded ? 'opacity-100' : 'opacity-0',
            )}
          />
        </div>
      </div>
    );
  },
);
CardThumbnail.displayName = 'CardThumbnail';
