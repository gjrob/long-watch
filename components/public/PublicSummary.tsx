import type { LatestSignal } from '@/lib/types';

interface PublicSummaryProps {
  latest: LatestSignal | null;
}

export default function PublicSummary({ latest }: PublicSummaryProps) {
  const state = latest?.integrity_flag === false ? 'Investigating' : 'Stable';

  return (
    <div className="grid gap-3">
      <div className="rounded-md bg-[#1A2030] p-4">
        <div className="text-xs text-[#9AA4B2]">Current State</div>
        <div className="mt-1 text-lg font-semibold">{state}</div>
      </div>

      <div className="rounded-md bg-[#1A2030] p-4">
        <div className="text-xs text-[#9AA4B2]">What&apos;s Measured</div>
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
