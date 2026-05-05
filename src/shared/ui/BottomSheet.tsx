import { type ReactNode } from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib';

export type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Force the sheet to take the full screen height. */
  fullHeight?: boolean;
};

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  fullHeight,
}: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 animate-fade-in bg-bg-overlay/50" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-lg bg-bg-raised outline-none',
            fullHeight ? 'h-[95dvh]' : 'max-h-[85dvh]',
          )}
        >
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-fg/15" aria-hidden="true" />
          <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
            <div>
              <Drawer.Title className="text-base font-semibold text-fg">{title}</Drawer.Title>
              {description ? (
                <Drawer.Description className="mt-0.5 text-sm text-fg-muted">
                  {description}
                </Drawer.Description>
              ) : (
                <Drawer.Description className="sr-only">{title}</Drawer.Description>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Fermer"
              className="-mr-1 rounded-md p-2 text-fg-muted hover:bg-fg/5"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
          {footer ? (
            <footer className="border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              {footer}
            </footer>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
