import type { DeltaValues } from '@/lib/types';

interface DeltaChartProps {
  delta: DeltaValues;
}

function DeltaRow({ label, value }: { label: string; value: number }) {
  const sign = value >= 0 ? '+' : '';
  const barWidth = Math.min(Math.abs(value) * 40, 100);
  const isPositive = value >= 0;

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 shrink-0 text-xs text-[#9AA4B2]">{label}</div>
      <div className="relative flex h-4 flex-1 items-center">
        <div className="absolute left-1/2 h-full w-px bg-[#2A3242]" />
        <div
          className="absolute h-2 rounded-sm"
          style={{
            width: `${barWidth}%`,
            left: isPositive ? '50%' : `${50 - barWidth}%`,
            backgroundColor: '#4A5568',
          }}
        />
      </div>
      <div className="w-16 shrink-0 text-right font-mono text-xs text-[#E6EAF2]">
        {sign}{value.toFixed(4)}
      </div>
    </div>
  );
}

export default function DeltaChart({ delta }: DeltaChartProps) {
  return (
    <div className="space-y-3">
      <DeltaRow label="Signal 24h" value={delta.signal_24h} />
      <DeltaRow label="Signal 7d" value={delta.signal_7d} />
      <DeltaRow label="Temp 24h" value={delta.temperature_24h} />
      <DeltaRow label="Temp 7d" value={delta.temperature_7d} />
    </div>
  );
}
