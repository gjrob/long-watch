import type { Continuity } from '@/lib/types';

interface ContinuityDetailProps {
  continuity: Continuity;
}

function formatDate(iso: string): string {
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 16) + 'Z';
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const BAR_W = 560;
const BAR_H = 24;
const LABEL_Y = 44;

export default function ContinuityDetail({ continuity }: ContinuityDetailProps) {
  const windowStart = new Date(continuity.window_start).getTime();
  const windowEnd = new Date(continuity.window_end).getTime();
  const windowSpan = windowEnd - windowStart || 1;

  // Map gaps to pixel positions
  const gapRects = continuity.gaps.map((g) => {
    const expectedTime = new Date(g.expected_at).getTime();
    const intervalMs = continuity.expected_interval_hours * 60 * 60 * 1000;
    const x = ((expectedTime - intervalMs - windowStart) / windowSpan) * BAR_W;
    const w = Math.max((intervalMs / windowSpan) * BAR_W, 2);
    return { x: Math.max(0, x), w: Math.min(w, BAR_W - x), expected_at: g.expected_at };
  });

  return (
    <div>
      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <div className="text-[#9AA4B2]">Continuity</div>
        <div className="text-[#E6EAF2]">{continuity.continuity_pct}%</div>

        <div className="text-[#9AA4B2]">Observed / Expected</div>
        <div className="text-[#E6EAF2]">{continuity.total_observed} / {continuity.total_expected}</div>

        <div className="text-[#9AA4B2]">Expected interval</div>
        <div className="text-[#E6EAF2]">{continuity.expected_interval_hours}h</div>

        <div className="text-[#9AA4B2]">Gap count</div>
        <div className="text-[#E6EAF2]">{continuity.gap_count}</div>

        <div className="text-[#9AA4B2]">Longest gap</div>
        <div className="text-[#E6EAF2]">{continuity.longest_gap_hours}h</div>

        <div className="text-[#9AA4B2]">Window</div>
        <div className="text-[#E6EAF2]">
          {formatShortDate(continuity.window_start)} – {formatShortDate(continuity.window_end)}
        </div>
      </div>

      {/* Timeline bar */}
      <div className="mt-5 overflow-x-auto">
        <svg viewBox={`0 0 ${BAR_W} ${LABEL_Y + 10}`} className="w-full" style={{ minWidth: 360 }}>
          {/* Background bar — observed */}
          <rect x={0} y={0} width={BAR_W} height={BAR_H} rx={3} fill="#2A3242" />

          {/* Gap overlays */}
          {gapRects.map((g, i) => (
            <rect
              key={i}
              x={g.x}
              y={0}
              width={g.w}
              height={BAR_H}
              fill="#0E1116"
              stroke="#D4A373"
              strokeWidth={0.5}
              opacity={0.8}
            >
              <title>Missing: {formatDate(g.expected_at)}</title>
            </rect>
          ))}

          {/* Edge labels */}
          <text x={2} y={LABEL_Y} fill="#6B7280" fontSize={8}>
            {formatShortDate(continuity.window_start)}
          </text>
          <text x={BAR_W - 2} y={LABEL_Y} fill="#6B7280" fontSize={8} textAnchor="end">
            {formatShortDate(continuity.window_end)}
          </text>

          {/* Legend */}
          <rect x={BAR_W / 2 - 50} y={LABEL_Y - 6} width={10} height={6} rx={1} fill="#2A3242" />
          <text x={BAR_W / 2 - 36} y={LABEL_Y} fill="#6B7280" fontSize={7}>observed</text>
          <rect x={BAR_W / 2 + 10} y={LABEL_Y - 6} width={10} height={6} rx={1} fill="#0E1116" stroke="#D4A373" strokeWidth={0.5} />
          <text x={BAR_W / 2 + 24} y={LABEL_Y} fill="#6B7280" fontSize={7}>gap</text>
        </svg>
      </div>

      {/* Gap log */}
      {continuity.gaps.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-[#9AA4B2]">Gap log</div>
          <div className="mt-2 space-y-1.5">
            {continuity.gaps.map((g, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-[#1A2030] px-3 py-2">
                <div className="text-xs text-[#E6EAF2]">
                  Missing: {formatShortDate(g.expected_at)}
                </div>
                <div className="text-xs text-[#6B7280]">
                  {g.duration_hours}h after {formatShortDate(g.previous_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
