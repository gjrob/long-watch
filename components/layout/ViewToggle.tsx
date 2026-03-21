'use client';

interface ViewToggleProps {
  mode: 'public' | 'expert';
  onChange: (mode: 'public' | 'expert') => void;
}

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <button
        onClick={() => onChange('public')}
        className={mode === 'public' ? 'text-[#E6EAF2] underline underline-offset-4' : 'text-[#9AA4B2]'}
      >
        Public View
      </button>
      <span className="text-[#6B7280]">|</span>
      <button
        onClick={() => onChange('expert')}
        className={mode === 'expert' ? 'text-[#E6EAF2] underline underline-offset-4' : 'text-[#9AA4B2]'}
      >
        Expert View
      </button>
    </div>
  );
}
