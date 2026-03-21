interface StabilityDurationProps {
  days: number;
}

export default function StabilityDuration({ days }: StabilityDurationProps) {
  return (
    <div className="rounded-md bg-[#1A2030] p-4">
      <div className="text-xs text-[#9AA4B2]">Stability</div>
      <div className="mt-1 text-sm text-[#E6EAF2]">
        No significant deviation for: <span className="font-semibold">{days} days</span>
      </div>
    </div>
  );
}
