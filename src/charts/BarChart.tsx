/** Horizontal bar chart — sessions by channel, with change indicator support. */
import { useMeasure } from "./useMeasure";

export interface BarChartItem {
  label: string;
  value: number;
  change?: number;
}

interface BarChartProps {
  data: BarChartItem[];
  formatValue?: (v: number) => string;
  ariaLabel?: string;
}

export function BarChart({ data, formatValue = (v) => String(v), ariaLabel }: BarChartProps) {
  const { setNode, width } = useMeasure<HTMLDivElement>();
  const max = Math.max(...data.map((d) => d.value), 1);
  const barAreaWidth = Math.max(120, width - 140);

  return (
    <div ref={setNode} className="w-full space-y-3" role="img" aria-label={ariaLabel}>
      {data.map((item) => {
        const pct = (item.value / max) * 100;
        const up = (item.change ?? 0) >= 0;
        return (
          <div key={item.label} className="flex items-center gap-3 text-sm">
            <span className="text-muted w-28 shrink-0 truncate">{item.label}</span>
            <div
              className="bg-default-soft h-6 flex-1 overflow-hidden rounded-md"
              style={{ maxWidth: barAreaWidth }}
            >
              <div
                className="bg-accent flex h-full items-center justify-end rounded-md pr-2 transition-[width] duration-500"
                style={{ width: `${Math.max(pct, 4)}%` }}
              >
                <span className="text-accent-foreground text-[11px] font-medium tabular-nums">
                  {formatValue(item.value)}
                </span>
              </div>
            </div>
            {item.change !== undefined && (
              <span
                className={`w-14 shrink-0 text-right text-xs font-medium tabular-nums ${
                  up ? "text-success" : "text-danger"
                }`}
              >
                {up ? "+" : ""}
                {(item.change * 100).toFixed(1)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
