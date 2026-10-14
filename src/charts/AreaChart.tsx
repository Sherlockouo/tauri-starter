/**
 * Responsive area/line chart with grid, sparse x labels and a hover tooltip.
 * Hand-rolled SVG so it follows the HeroUI theme in both light and dark mode.
 */
import { useMemo, useState } from "react";
import { useMeasure } from "./useMeasure";

export interface AreaChartPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: AreaChartPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  ariaLabel?: string;
}

const PAD = { top: 12, right: 8, bottom: 24, left: 48 };
const GRID_LINES = 4;

export function AreaChart({ data, height = 260, formatValue = (v) => String(v), ariaLabel }: AreaChartProps) {
  const { setNode, width } = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const geom = useMemo(() => {
    if (!data.length || width === 0) return null;
    const innerW = width - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    // Pad the domain so the line never touches the frame
    const span = max - min || 1;
    const yMin = min - span * 0.08;
    const yMax = max + span * 0.08;

    const x = (i: number) => PAD.left + (i / (data.length - 1)) * innerW;
    const y = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

    const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
    const area = `${line} L${x(data.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${PAD.left},${(PAD.top + innerH).toFixed(1)} Z`;

    const ticks = Array.from({ length: GRID_LINES + 1 }, (_, i) => {
      const v = yMin + ((yMax - yMin) / GRID_LINES) * i;
      return { v, y: y(v) };
    });

    // Sparse x labels — at most 6
    const labelEvery = Math.max(1, Math.ceil(data.length / 6));
    const xLabels = data
      .map((d, i) => ({ label: d.label, x: x(i) }))
      .filter((_, i) => i % labelEvery === 0 || i === data.length - 1);

    return { x, y, line, area, ticks, xLabels, innerW, innerH };
  }, [data, width, height]);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!geom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const ratio = (px - PAD.left) / geom.innerW;
    const idx = Math.round(ratio * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const hovered = hover !== null ? data[hover] : null;

  return (
    <div ref={setNode} className="relative w-full" style={{ height }}>
      {geom && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid + y labels */}
          {geom.ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={t.y}
                y2={t.y}
                className="stroke-foreground/10"
                strokeDasharray="3 4"
              />
              <text
                x={PAD.left - 8}
                y={t.y + 3}
                textAnchor="end"
                className="fill-muted text-[10px]"
              >
                {formatValue(t.v)}
              </text>
            </g>
          ))}

          {/* X labels */}
          {geom.xLabels.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={height - 6}
              textAnchor={i === 0 ? "start" : i === geom.xLabels.length - 1 ? "end" : "middle"}
              className="fill-muted text-[10px]"
            >
              {l.label}
            </text>
          ))}

          <path d={geom.area} fill="url(#area-fill)" />
          <path
            d={geom.line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover crosshair */}
          {hover !== null && (
            <g>
              <line
                x1={geom.x(hover)}
                x2={geom.x(hover)}
                y1={PAD.top}
                y2={PAD.top + geom.innerH}
                className="stroke-foreground/25"
              />
              <circle
                cx={geom.x(hover)}
                cy={geom.y(data[hover].value)}
                r="4"
                fill="var(--accent)"
                className="stroke-background"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      )}

      {/* Tooltip */}
      {hovered && (
        <div
          className="bg-popover text-popover-foreground pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(Math.max(geom ? geom.x(hover ?? 0) : 0, 60), width - 60),
            top: 8,
          }}
        >
          <div className="text-muted">{hovered.label}</div>
          <div className="font-semibold">{formatValue(hovered.value)}</div>
        </div>
      )}
    </div>
  );
}
