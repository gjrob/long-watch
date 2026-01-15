'use client';

import { useState } from 'react';

export default function ViewToggle() {
  const [mode, setMode] = useState<'public' | 'expert'>('public');

  return (
    <div className="flex items-center gap-3 text-xs">
      <button
        onClick={() => setMode('public')}
        className={mode === 'public' ? 'text-[#E6EAF2] underline underline-offset-4' : 'text-[#9AA4B2]'}
      >
        Public View
      </button>
      <span className="text-[#6B7280]">|</span>
      <button
        onClick={() => setMode('expert')}
        className={mode === 'expert' ? 'text-[#E6EAF2] underline underline-offset-4' : 'text-[#9AA4B2]'}
      >
        Expert View
      </button>
    </div>
  );
}
