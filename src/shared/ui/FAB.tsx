import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib';

export type FABProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ariaLabel: string;
};

export const FAB = forwardRef<HTMLButtonElement, FABProps>(
  ({ className, ariaLabel, type = 'button', children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={ariaLabel}
      className={cn(
        'fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-20',
        'flex h-14 w-14 items-center justify-center rounded-full',
        'bg-accent text-accent-fg shadow-lg transition-transform duration-fast',
        'hover:scale-105 active:scale-95',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
FAB.displayName = 'FAB';
