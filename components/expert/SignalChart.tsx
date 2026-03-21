import type { TimeseriesPoint } from '@/lib/types';

interface SignalChartProps {
  timeseries: TimeseriesPoint[];
}

const W = 600;
const H = 180;
const PAD = { top: 16, right: 12, bottom: 28, left: 44 };

function buildPath(
  points: TimeseriesPoint[],
  accessor: (p: TimeseriesPoint) => number,
  xScale: (i: number) => number,
  yScale: (v: number) => number,
): string {
  return points
    .map((p, i) => {
      const x = xScale(i);
      const y = yScale(accessor(p));
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

export default function SignalChart({ timeseries }: SignalChartProps) {
  if (!timeseries.length) return null;

  const signalValues = timeseries.map((p) => p.signal_value);
  const tempValues = timeseries.map((p) => p.temperature_value);

  const allValues = [...signalValues, ...tempValues];
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const range = maxV - minV || 1;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const xScale = (i: number) => PAD.left + (i / (timeseries.length - 1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - ((v - minV) / range) * plotH;

  const signalPath = buildPath(timeseries, (p) => p.signal_value, xScale, yScale);
  const tempPath = buildPath(timeseries, (p) => p.temperature_value, xScale, yScale);

  // Y-axis labels
  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = minV + (range * i) / yTicks;
    return { v, y: yScale(v) };
  });

  // X-axis labels (first, middle, last)
  const xLabels = [0, Math.floor(timeseries.length / 2), timeseries.length - 1].map((i) => ({
    label: new Date(timeseries[i].observed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    x: xScale(i),
  }));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 400 }}>
        {/* Grid lines */}
        {yLabels.map(({ v, y }) => (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#2A3242" strokeWidth={0.5} />
            <text x={PAD.left - 6} y={y + 3} textAnchor="end" fill="#6B7280" fontSize={8}>
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map(({ label, x }) => (
          <text key={label} x={x} y={H - 6} textAnchor="middle" fill="#6B7280" fontSize={8}>
            {label}
          </text>
        ))}

        {/* Temperature line */}
        <path d={tempPath} fill="none" stroke="#4A5568" strokeWidth={1} opacity={0.6} />

        {/* Signal line */}
        <path d={signalPath} fill="none" stroke="#9AA4B2" strokeWidth={1.5} />

        {/* Legend */}
        <line x1={PAD.left} y1={8} x2={PAD.left + 16} y2={8} stroke="#9AA4B2" strokeWidth={1.5} />
        <text x={PAD.left + 20} y={11} fill="#9AA4B2" fontSize={7}>Signal</text>

        <line x1={PAD.left + 60} y1={8} x2={PAD.left + 76} y2={8} stroke="#4A5568" strokeWidth={1} opacity={0.6} />
        <text x={PAD.left + 80} y={11} fill="#6B7280" fontSize={7}>Temperature</text>
      </svg>
    </div>
  );
}
