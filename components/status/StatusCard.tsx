type Latest = {
  observed_at: string;
  signal_value: number;
  temperature_value: number;
  environment_value: number;
  integrity_flag: boolean;
  batch_hash: string;
} | null;

export default function StatusCard({ latest }: { latest: Latest }) {
  const stable = latest?.integrity_flag ?? true;
  const label = stable ? 'STABLE' : 'INVESTIGATING';
  const sub = stable
    ? 'No statistically significant deviations detected.'
    : 'Integrity signal indicates a deviation. Investigation required.';

  return (
    <div>
      <div className="text-5xl font-semibold tracking-tight">{label}</div>
      <div className="mt-2 text-sm text-[#9AA4B2]">{sub}</div>

      {latest && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#9AA4B2]">
          <div>Signal: <span className="text-[#E6EAF2]">{latest.signal_value.toFixed(2)}</span></div>
          <div>Temp: <span className="text-[#E6EAF2]">{latest.temperature_value.toFixed(2)}</span></div>
          <div>Env: <span className="text-[#E6EAF2]">{latest.environment_value.toFixed(2)}</span></div>
          <div>Observed: <span className="text-[#E6EAF2]">{new Date(latest.observed_at).toISOString().slice(0, 19)}Z</span></div>
        </div>
      )}
    </div>
  );
}
