export default function Header() {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  return (
    <header className="flex items-start justify-between">
      <div>
        <h1 className="text-lg font-semibold">The Long Watch</h1>
        <p className="mt-1 text-xs text-[#9AA4B2]">Long-duration verification prototype</p>
      </div>
      <div className="text-right text-xs text-[#9AA4B2]">
        <div>Last update: {now}</div>
        <div className="text-[#6B7280]">Append-only</div>
      </div>
    </header>
  );
}
