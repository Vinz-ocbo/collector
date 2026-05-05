import { forwardRef, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/shared/lib';
import { Button } from './Button';

export type StepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  ariaLabel: string;
  disabled?: boolean | undefined;
  className?: string | undefined;
};

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      value,
      onChange,
      min = 0,
      max = Number.MAX_SAFE_INTEGER,
      step = 1,
      ariaLabel,
      disabled,
      className,
    },
    ref,
  ) => {
    const dec = useCallback(() => {
      onChange(Math.max(min, value - step));
    }, [value, step, min, onChange]);

    const inc = useCallback(() => {
      onChange(Math.min(max, value + step));
    }, [value, step, max, onChange]);

    const handleInput = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const parsed = Number(event.target.value);
        if (Number.isNaN(parsed)) return;
        onChange(Math.min(max, Math.max(min, parsed)));
      },
      [min, max, onChange],
    );

    return (
      <div
        ref={ref}
        role="group"
        aria-label={ariaLabel}
        className={cn('inline-flex items-center gap-2', className)}
      >
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={dec}
          disabled={disabled || value <= min}
          aria-label="Diminuer"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </Button>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={handleInput}
          disabled={disabled}
          aria-label={`${ariaLabel} (valeur)`}
          className="min-h-tap w-16 rounded-md border border-border bg-bg-raised text-center text-base text-fg disabled:opacity-50"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={inc}
          disabled={disabled || value >= max}
          aria-label="Augmenter"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    );
  },
);
Stepper.displayName = 'Stepper';
