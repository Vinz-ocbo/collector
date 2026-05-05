import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib';

export const cardVariants = cva('rounded-lg border bg-bg-raised', {
  variants: {
    elevation: {
      flat: 'border-border',
      raised: 'border-border shadow-sm',
    },
    interactive: {
      true: 'transition-colors hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      false: '',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
    },
  },
  defaultVariants: { elevation: 'flat', interactive: false, padding: 'md' },
});

export type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation, interactive, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ elevation, interactive, padding }), className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';
