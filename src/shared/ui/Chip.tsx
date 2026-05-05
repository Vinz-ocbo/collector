import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib';

export const chipVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-3 text-sm font-medium transition-colors',
  {
    variants: {
      active: {
        true: 'bg-accent text-accent-fg border-accent',
        false: 'bg-bg-raised text-fg border-border hover:bg-fg/5',
      },
      size: {
        sm: 'h-7',
        md: 'h-8',
      },
    },
    defaultVariants: { active: false, size: 'md' },
  },
);

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof chipVariants> & {
    onRemove?: () => void;
    removeLabel?: string;
  };

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      className,
      active,
      size,
      onRemove,
      removeLabel = 'Retirer',
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={active ?? undefined}
      className={cn(chipVariants({ active, size }), className)}
      {...props}
    >
      <span>{children}</span>
      {onRemove ? (
        <span
          role="button"
          tabIndex={0}
          aria-label={removeLabel}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              onRemove();
            }
          }}
          className="-mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-fg/10"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </span>
      ) : null}
    </button>
  ),
);
Chip.displayName = 'Chip';
