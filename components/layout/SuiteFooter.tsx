'use client';

const SUITE_LINKS = [
  { name: 'Cathedral Ledger', href: 'https://cathedral-ledger.vercel.app' },
  { name: 'Cape Fear Memoria', href: 'https://capefearmemoria.org' },
  { name: 'The Long Watch', href: 'https://longwatch.win' },
  { name: 'Council of Witnesses', href: 'https://councilofwitnesses.org' },
];

export default function SuiteFooter() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[#6B7280]">
      {SUITE_LINKS.map((link, i) => (
        <span key={link.name} className="flex items-center gap-4">
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#9AA4B2]"
          >
            {link.name}
          </a>
          {i < SUITE_LINKS.length - 1 && (
            <span className="text-[#2A3242]">·</span>
          )}
        </span>
      ))}
    </div>
  );
}
