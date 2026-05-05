import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/shared/lib';

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}
      {...props}
    >
      {icon ? (
        <div className="text-fg-subtle" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      {description ? <p className="max-w-prose text-sm text-fg-muted">{description}</p> : null}
      {action ? (
        <div className="mt-2 flex flex-col items-stretch gap-2 sm:flex-row">{action}</div>
      ) : null}
    </div>
  ),
);
EmptyState.displayName = 'EmptyState';
