import { cn } from '@/shared/lib';

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export type DonutChartProps = {
  slices: DonutSlice[];
  /** Diameter in px. */
  size?: number;
  /** Thickness of the ring as a fraction of the radius (0–1). */
  thickness?: number;
  /** Total override; when omitted, sums slice values. */
  total?: number;
  /** Center label, eg. "247 cartes". */
  centerLabel?: string;
  centerValue?: string;
  className?: string;
};

/**
 * Tiny SVG donut chart. Accessible: backed by a hidden table for screen
 * readers; visual labels inside slices kept brief.
 */
export function DonutChart({
  slices,
  size = 220,
  thickness = 0.32,
  total,
  centerLabel,
  centerValue,
  className,
}: DonutChartProps) {
  const sum = total ?? slices.reduce((acc, s) => acc + s.value, 0);
  const radius = size / 2;
  const innerRadius = radius * (1 - thickness);
  const strokeWidth = radius - innerRadius;
  const ringRadius = (radius + innerRadius) / 2;
  const circumference = 2 * Math.PI * ringRadius;

  let offset = 0;
  const arcs = slices.map((slice) => {
    const fraction = sum > 0 ? slice.value / sum : 0;
    const length = fraction * circumference;
    const arc = {
      ...slice,
      length,
      offset,
      fraction,
    };
    offset += length;
    return arc;
  });

  return (
    <figure className={cn('flex flex-col items-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${String(size)} ${String(size)}`}
        role="img"
        aria-label={centerLabel ?? 'Répartition'}
        className="-rotate-90"
      >
        {sum === 0 ? (
          <circle
            cx={radius}
            cy={radius}
            r={ringRadius}
            fill="none"
            stroke="rgb(var(--color-border))"
            strokeWidth={strokeWidth}
          />
        ) : (
          arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={radius}
              cy={radius}
              r={ringRadius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${String(arc.length)} ${String(circumference - arc.length)}`}
              strokeDashoffset={-arc.offset}
            >
              <title>
                {arc.label}: {arc.value} ({Math.round(arc.fraction * 100)}%)
              </title>
            </circle>
          ))
        )}
      </svg>
      {centerValue || centerLabel ? (
        <figcaption
          className="-mt-[55%] flex h-0 flex-col items-center text-center"
          aria-hidden="true"
        >
          {centerValue ? <p className="text-2xl font-bold leading-tight">{centerValue}</p> : null}
          {centerLabel ? <p className="text-xs text-fg-muted">{centerLabel}</p> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
