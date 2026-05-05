import { type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/shared/lib';

export type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
  className?: string;
  sticky?: boolean;
};

export function PageHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Retour',
  actions,
  className,
  sticky = true,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center gap-2 border-b border-border bg-bg-raised px-2 py-2',
        sticky && 'sticky top-0 z-10',
        className,
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="flex min-h-tap min-w-tap items-center justify-center rounded-md text-fg-muted hover:bg-fg/5"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : (
        <div className="w-2" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1 px-1">
        <h1 className="truncate text-base font-semibold text-fg">{title}</h1>
        {subtitle ? <p className="truncate text-xs text-fg-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
    </header>
  );
}
