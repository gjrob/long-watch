interface MicroStatsProps {
  signals: number;
  observations: number;
  edits: number;
}

export default function MicroStats({ signals, observations, edits }: MicroStatsProps) {
  return (
    <div className="text-xs text-[#9AA4B2]">
      Signals: <span className="text-[#E6EAF2]">{signals}</span> · Observations:{' '}
      <span className="text-[#E6EAF2]">{observations.toLocaleString()}</span> · Edits:{' '}
      <span className="text-[#E6EAF2]">{edits}</span>
    </div>
  );
}
