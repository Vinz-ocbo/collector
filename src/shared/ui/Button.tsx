import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-fast disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg hover:bg-accent-hover active:opacity-90',
        secondary: 'bg-bg-raised text-fg border border-border hover:bg-fg/5 active:bg-fg/10',
        tertiary: 'text-fg hover:bg-fg/5 active:bg-fg/10',
        destructive: 'bg-danger text-white hover:opacity-90 active:opacity-80',
        ghost: 'text-fg-muted hover:text-fg hover:bg-fg/5',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'min-h-tap px-4 text-base',
        lg: 'h-12 px-6 text-base',
        icon: 'min-h-tap min-w-tap p-0',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild, type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
