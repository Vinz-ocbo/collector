import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib';

export const toastVariants = cva(
  'pointer-events-auto flex w-full items-center gap-3 rounded-md border p-3 shadow-md',
  {
    variants: {
      tone: {
        neutral: 'bg-bg-raised border-border text-fg',
        success: 'bg-success-bg border-success/30 text-success',
        info: 'bg-info-bg border-info/30 text-info',
        warning: 'bg-warning-bg border-warning/30 text-warning',
        danger: 'bg-danger-bg border-danger/30 text-danger',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type ToastTone = NonNullable<VariantProps<typeof toastVariants>['tone']>;

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
  action?: { label: string; onClick: () => void };
};

type ToastEntry = ToastInput & { id: string; open: boolean };

type ToastContextValue = {
  show: (input: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <Toaster />');
  return ctx;
}

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const show = useCallback((input: ToastInput): string => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...input, id, open: true }]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open: false } : t)));
  }, []);

  const handleOpenChange = useCallback((id: string, open: boolean) => {
    if (!open) {
      // delay removal to let the close animation play
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open: false } : t)));
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 200);
    }
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            open={t.open}
            duration={t.duration ?? (t.action ? 5000 : 4000)}
            onOpenChange={(open) => handleOpenChange(t.id, open)}
            className={cn(toastVariants({ tone: t.tone ?? 'neutral' }))}
          >
            <div className="flex-1">
              <ToastPrimitive.Title className="text-sm font-medium">{t.title}</ToastPrimitive.Title>
              {t.description ? (
                <ToastPrimitive.Description className="mt-0.5 text-sm text-fg-muted">
                  {t.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            {t.action ? (
              <ToastPrimitive.Action
                asChild
                altText={t.action.label}
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
              >
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-sm font-medium underline-offset-2 hover:underline"
                >
                  {t.action.label}
                </button>
              </ToastPrimitive.Action>
            ) : null}
            <ToastPrimitive.Close aria-label="Fermer" className="rounded-md p-1 hover:bg-fg/10">
              <X className="h-4 w-4" aria-hidden="true" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-20 right-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
