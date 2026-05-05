import { cn } from '@/shared/lib';

export type BarRow = {
  key: string;
  label: string;
  value: number;
  color?: string;
};

export type BarChartHorizontalProps = {
  rows: BarRow[];
  className?: string;
  /** Optional unit label appended to values (eg. "cartes"). */
  unit?: string;
  onSelect?: (key: string) => void;
};

/**
 * CSS-based horizontal bar chart. Pure HTML/CSS — no SVG, no chart library.
 * Each row is a button when onSelect is provided, an article otherwise.
 */
export function BarChartHorizontal({ rows, className, unit, onSelect }: BarChartHorizontalProps) {
  const max = rows.reduce((acc, r) => Math.max(acc, r.value), 0);
  return (
    <ol className={cn('flex flex-col gap-2', className)}>
      {rows.map((row) => {
        const pct = max > 0 ? (row.value / max) * 100 : 0;
        const color = row.color ?? 'rgb(var(--color-accent))';
        const content = (
          <>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{row.label}</span>
              <span className="tabular-nums text-fg-muted">
                {row.value}
                {unit ? ` ${unit}` : ''}
              </span>
            </div>
            <div
              className="mt-1 h-2 w-full overflow-hidden rounded-full bg-fg/5"
              role="presentation"
            >
              <div
                className="h-full rounded-full transition-[width] duration-slow"
                style={{ width: `${String(pct)}%`, backgroundColor: color }}
              />
            </div>
          </>
        );
        return (
          <li key={row.key}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(row.key)}
                className="block w-full rounded-md p-2 text-left hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`${row.label} : ${String(row.value)}${unit ? ` ${unit}` : ''}`}
              >
                {content}
              </button>
            ) : (
              <article
                className="p-2"
                aria-label={`${row.label} : ${String(row.value)}${unit ? ` ${unit}` : ''}`}
              >
                {content}
              </article>
            )}
          </li>
        );
      })}
    </ol>
  );
}
