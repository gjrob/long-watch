type Item = {
  detected_at: string;
  sigma: number;
  status: string;
};

export default function AnomalyLog({ items }: { items: Item[] }) {
  if (!items?.length) {
    return <div className="text-sm text-[#9AA4B2]">No recent anomalies.</div>;
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 6).map((a, idx) => (
        <div key={idx} className="rounded-md bg-[#1A2030] p-3">
          <div className="flex items-center justify-between text-xs text-[#9AA4B2]">
            <span>{new Date(a.detected_at).toISOString().slice(0, 19)}Z</span>
            <span>{a.status}</span>
          </div>
          <div className="mt-1 text-sm text-[#E6EAF2]">Deviation: {a.sigma.toFixed(2)}σ</div>
        </div>
      ))}
    </div>
  );
}
