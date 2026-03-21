'use client';

import type { Continuity } from '@/lib/types';

interface HeaderProps {
  lastUpdate: string | null;
  continuity?: Continuity | null;
}

export default function Header({ lastUpdate, continuity }: HeaderProps) {
  const display = lastUpdate
    ? new Date(lastUpdate).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
    : '—';

  return (
    <header className="flex items-start justify-between">
      <div>
        <h1 className="text-lg font-semibold">The Long Watch</h1>
        <p className="mt-1 text-xs text-[#9AA4B2]">Long-duration verification prototype</p>
      </div>
      <div className="text-right text-xs text-[#9AA4B2]">
        <div>Last update: {display}</div>
        <div className="mt-0.5 flex items-center justify-end gap-2">
          <span className="text-[#6B7280]">Append-only</span>
          {continuity && (
            <>
              <span className="text-[#2A3242]">·</span>
              <span className="text-[#6B7280]">
                Continuity {continuity.continuity_pct}%
                {continuity.gap_count > 0 && (
                  <span className="ml-1 text-[#D4A373]">
                    ({continuity.gap_count} {continuity.gap_count === 1 ? 'gap' : 'gaps'})
                  </span>
                )}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
