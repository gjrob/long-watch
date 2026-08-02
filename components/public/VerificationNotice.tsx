export default function VerificationNotice() {
  return (
    <div className="rounded-lg bg-[#141922] px-6 py-4 text-xs leading-relaxed text-[#6B7280]">
      Records are append-only and hash-linked: each observation carries the hash
      of the one before it, so the order and content of past rows cannot be
      changed without breaking the chain.
      <br />
      The chain can be checked independently at{' '}
      <span className="font-mono">/api/verify/head</span> and{' '}
      <span className="font-mono">/api/verify/series</span>.
      <br />
      Gaps are part of the record. When the writer stops, the silence is kept
      rather than filled.
    </div>
  );
}
