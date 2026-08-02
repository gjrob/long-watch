export default function DataOrigin() {
  return (
    <div className="text-xs leading-relaxed text-[#6B7280]">
      Data source: observations written by a scheduled job to an append-only
      Postgres table, each row hash-linked to the one before it.
      <br />
      Every value on this page is read from that table. Nothing is modelled,
      simulated, or filled in.
    </div>
  );
}
