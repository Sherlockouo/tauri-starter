/** Donut chart — traffic share, with an in-doughnut center label and legend. */
import { formatPercent } from "../lib/format";
import type { TrafficSource } from "../data/types";

interface DonutChartProps {
  data: TrafficSource[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  ariaLabel?: string;
}

export function DonutChart({
  data,
  size = 180,
  thickness = 22,
  centerLabel = "Total",
  ariaLabel,
}: DonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((d) => {
    const fraction = d.value / total;
    const seg = {
      ...d,
      fraction,
      dash: fraction * circumference,
      offset,
    };
    offset += fraction * circumference;
    return seg;
  });

  return (
    <div className="flex flex-wrap items-center justify-center gap-8" role="img" aria-label={ariaLabel}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-default-soft"
            strokeWidth={thickness}
          />
          {segments.map((seg) => (
            <circle
              key={seg.name}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(seg.dash - 3, 0)} ${circumference}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="round"
              className="transition-[stroke-dasharray] duration-500"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-muted text-xs">{centerLabel}</span>
          <span className="text-foreground text-2xl font-semibold tabular-nums">{total}%</span>
        </div>
      </div>

      <ul className="space-y-2.5">
        {segments.map((seg) => (
          <li key={seg.name} className="flex items-center gap-2.5 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: seg.color }} />
            <span className="text-foreground min-w-36">{seg.name}</span>
            <span className="text-muted tabular-nums">{formatPercent(seg.fraction, 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
