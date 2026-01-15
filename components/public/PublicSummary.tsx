type Latest = {
  observed_at: string;
  signal_value: number;
  temperature_value: number;
  environment_value: number;
  integrity_flag: boolean;
  batch_hash: string;
} | null;

export default function PublicSummary({ latest }: { latest: Latest }) {
  const state = latest?.integrity_flag === false ? 'Investigating' : 'Stable';

  return (
    <div className="grid gap-3">
      <div className="rounded-md bg-[#1A2030] p-4">
        <div className="text-xs text-[#9AA4B2]">Current State</div>
        <div className="mt-1 text-lg font-semibold">{state}</div>
      </div>

      <div className="rounded-md bg-[#1A2030] p-4">
        <div className="text-xs text-[#9AA4B2]">What’s Measured</div>
        <ul className="mt-2 space-y-1 text-sm text-[#E6EAF2]">
          <li>Energy emission (proxy)</li>
          <li>Temperature (proxy)</li>
          <li>Environmental context</li>
          <li>Integrity signal</li>
        </ul>
      </div>

      <div className="rounded-md bg-[#1A2030] p-4">
        <div className="text-xs text-[#9AA4B2]">What It Means</div>
        <div className="mt-2 text-sm text-[#E6EAF2]">Monitoring continues automatically.</div>
      </div>
    </div>
  );
}
