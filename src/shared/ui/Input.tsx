import { forwardRef, type InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib';

export const inputVariants = cva(
  'w-full rounded-md border bg-bg-raised text-fg placeholder:text-fg-subtle transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed read-only:bg-bg',
  {
    variants: {
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'min-h-tap px-3 text-base',
        lg: 'h-12 px-4 text-base',
      },
      invalid: {
        true: 'border-danger focus-visible:ring-danger',
        false: 'border-border focus-visible:border-accent',
      },
    },
    defaultVariants: { size: 'md', invalid: false },
  },
);

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> &
  VariantProps<typeof inputVariants>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, invalid, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid ?? undefined}
        className={cn(inputVariants({ size, invalid }), className)}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
