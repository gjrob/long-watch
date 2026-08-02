'use client';

import type { ObservingState } from '@/lib/types';
import { humanAge, utcStamp } from '@/lib/format';

interface HeaderProps {
  observing: ObservingState | null;
}

/**
 * "Last update" previously showed `fetched_at` — the time the browser made the
 * request. It therefore read as current on every load, forever, no matter how
 * long ago the last real observation was. It now shows the age of the newest
 * row in `signals`, and says so when the writer has stopped.
 */
export default function Header({ observing }: HeaderProps) {
  const stopped = observing ? !observing.is_observing : true;

  return (
    <header className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <a href="https://cathedral-ledger.vercel.app" target="_blank" rel="noopener noreferrer">
          <img src="/brand/no-guidance-logo.svg" alt="No Guidance" className="h-8 w-auto" />
        </a>
        <div>
          <h1 className="text-lg font-semibold">The Long Watch</h1>
          <p className="mt-1 text-xs text-[#9AA4B2]">Long-duration verification prototype</p>
        </div>
      </div>

      <div className="text-right text-xs text-[#9AA4B2]">
        <div>
          Last observation:{' '}
          <span className={stopped ? 'text-[#D4A373]' : 'text-[#E6EAF2]'}>
            {observing ? humanAge(observing.age_seconds) : '—'}
          </span>
        </div>
        <div className="mt-0.5 font-mono text-[#6B7280]">
          {utcStamp(observing?.last_observed_at ?? null)}
        </div>
        <div className="mt-0.5 text-[#6B7280]">Append-only</div>
      </div>
    </header>
  );
}
