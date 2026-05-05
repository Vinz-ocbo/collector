import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/shared/lib';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('animate-pulse-soft rounded-md bg-fg/10', className)}
      {...props}
    />
  ),
);
Skeleton.displayName = 'Skeleton';
