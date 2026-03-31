'use client';

interface CathedralArchProps {
  position: 'top' | 'bottom';
}

export default function CathedralArch({ position }: CathedralArchProps) {
  const flip = position === 'bottom';
  return (
    <div className={`w-full overflow-hidden ${flip ? 'mt-8' : 'mb-4'}`}>
      <img
        src="/brand/cathedral-arch.svg"
        alt=""
        aria-hidden="true"
        className="w-full h-[48px] object-cover"
        style={flip ? { transform: 'scaleY(-1)' } : undefined}
      />
    </div>
  );
}
