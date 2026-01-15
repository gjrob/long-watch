export default function ChangeStrip() {
  // Placeholder strip: 30 markers, one anomaly
  const markers = Array.from({ length: 30 }).map((_, i) => i);
  const anomalyIndex = 18;

  return (
    <div>
      <div className="text-sm font-semibold">Change Timeline</div>
      <div className="mt-1 text-xs text-[#9AA4B2]">Last 30 days</div>

      <div className="mt-4 flex items-center gap-1">
        <div className="h-px flex-1 bg-[#2A3242]" />
      </div>

      <div className="mt-3 flex items-center justify-between">
        {markers.map((i) => {
          const isAnomaly = i === anomalyIndex;
          return (
            <div
              key={i}
              title={isAnomaly ? 'Transient deviation · auto-resolved · logged' : 'Normal'}
              className={
                isAnomaly
                  ? 'h-2 w-2 rounded-full border border-[#D4A373] bg-transparent'
                  : 'h-1.5 w-1.5 rounded-full bg-[#2A3242]'
              }
            />
          );
        })}
      </div>

      <div className="mt-4 text-xs text-[#9AA4B2]">
        Hover markers for details.
      </div>
    </div>
  );
}
