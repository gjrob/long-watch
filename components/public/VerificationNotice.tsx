export default function VerificationNotice() {
  return (
    <div className="rounded-lg bg-[#141922] px-6 py-4 text-xs leading-relaxed text-[#6B7280]">
      This system is publicly inspectable.
      <br />
      All records are append-only.
      <br />
      No historical data can be modified.
    </div>
  );
}
