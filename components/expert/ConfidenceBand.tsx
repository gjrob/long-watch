import type { TimeseriesPoint } from '@/lib/types';

interface ConfidenceBandProps {
  timeseries: TimeseriesPoint[];
}

const W = 600;
const H = 160;
const PAD = { top: 12, right: 12, bottom: 24, left: 44 };

export default function ConfidenceBand({ timeseries }: ConfidenceBandProps) {
  if (!timeseries.length) return null;

  const values = timeseries.map((p) => p.signal_value);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const stddev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);

  const bandMult = 2; // 2-sigma band
  const minV = mean - stddev * 3;
  const maxV = mean + stddev * 3;
  const range = maxV - minV || 1;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const xScale = (i: number) => PAD.left + (i / (timeseries.length - 1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - ((v - minV) / range) * plotH;

  // Confidence band polygon
  const upperY = yScale(mean + stddev * bandMult);
  const lowerY = yScale(mean - stddev * bandMult);
  const bandPath = `M${PAD.left},${upperY} L${W - PAD.right},${upperY} L${W - PAD.right},${lowerY} L${PAD.left},${lowerY} Z`;

  // Signal line
  const linePath = timeseries
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.signal_value)}`)
    .join(' ');

  // Mean line
  const meanY = yScale(mean);

  // Y labels
  const yTicks = [mean - stddev * bandMult, mean, mean + stddev * bandMult];

  // X labels
  const xIndices = [0, Math.floor(timeseries.length / 2), timeseries.length - 1];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 400 }}>
        {/* Band */}
        <path d={bandPath} fill="#2A3242" opacity={0.4} />

        {/* Mean */}
        <line x1={PAD.left} y1={meanY} x2={W - PAD.right} y2={meanY} stroke="#4A5568" strokeWidth={0.5} strokeDasharray="4 3" />

        {/* Signal */}
        <path d={linePath} fill="none" stroke="#9AA4B2" strokeWidth={1.5} />

        {/* Y labels */}
        {yTicks.map((v) => (
          <text key={v} x={PAD.left - 6} y={yScale(v) + 3} textAnchor="end" fill="#6B7280" fontSize={8}>
            {v.toFixed(1)}
          </text>
        ))}

        {/* X labels */}
        {xIndices.map((i) => (
          <text key={i} x={xScale(i)} y={H - 6} textAnchor="middle" fill="#6B7280" fontSize={8}>
            {new Date(timeseries[i].observed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        ))}

        {/* Legend */}
        <rect x={PAD.left} y={2} width={12} height={6} fill="#2A3242" opacity={0.4} rx={1} />
        <text x={PAD.left + 16} y={8} fill="#6B7280" fontSize={7}>±2σ band</text>
        <line x1={PAD.left + 60} y1={5} x2={PAD.left + 72} y2={5} stroke="#9AA4B2" strokeWidth={1.5} />
        <text x={PAD.left + 76} y={8} fill="#9AA4B2" fontSize={7}>Signal</text>
      </svg>
    </div>
  );
}
