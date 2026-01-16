import crypto from "crypto";
import { supabaseServiceServer } from "@/lib/supabase/server";
function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return "[" + obj.map(stableStringify).join(",") + "]";
  }

  const keys = Object.keys(obj as Record<string, unknown>).sort();
  return (
    "{" +
    keys
      .map(
        (k) =>
          JSON.stringify(k) +
          ":" +
          stableStringify((obj as Record<string, unknown>)[k])
      )
      .join(",") +
    "}"
  );
}
function periodKey10Min(d: Date) {
  const bucket = Math.floor(d.getTime() / (10 * 60 * 1000));
  return `10m:${bucket}`;
}
function hashRow(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const token =
    req.headers.get("x-cron-secret") ||
    url.searchParams.get("token");

  if (!token || token !== process.env.CRON_SECRET) {
    return Response.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const supabase = supabaseServiceServer();

  // choose one series for v1; you can expand to multiple series keys later
  const series_key = "lw.core.heartbeat";
const now = new Date();
const observed_at = now.toISOString();
const period_key = periodKey10Min(now);

  // fetch last row to chain hashes
  const { data: last, error: lastErr } = await supabase
    .from("signals")
    .select("row_hash")
    .eq("series_key", series_key)
    .order("observed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) {
    return Response.json({ ok: false, error: "db_read_failed", detail: lastErr.message }, { status: 500 });
  }

  const prev_hash = last?.row_hash ?? null;

  const payload = {
    kind: "heartbeat",
    note: "scheduled observation",
  };

  const canonical = [
    observed_at,
    "snapshot",
    series_key,
    "cron:v1",
    stableStringify(payload),
    prev_hash ?? "",
  ].join("|");

  const row_hash = hashRow(canonical);
const { data: inserted, error: insErr } = await supabase
  .from("signals")
  .insert({
    observed_at,
    signal_type: "snapshot",
    series_key,
    source: "cron:v1",
    value_json: payload,
    meta_json: { version: 1 },
    is_public: true,
    prev_hash,
    row_hash,
    period_key, // ✅ idempotency key
  })
  .select("id, observed_at, row_hash, prev_hash, period_key")
  .single();

// Unique violation => cron ran twice for same period; treat as success
if (insErr) {
  // Postgres unique violation
  if ((insErr as any).code === "23505") {
    return Response.json({ ok: true, deduped: true, series_key, period_key });
  }

  return Response.json(
    { ok: false, error: "db_write_failed", detail: insErr.message },
    { status: 500 }
  );
}

  // minimal audit event
  await supabase.from("audit_events").insert({
    actor: "cron",
    event_type: "signal.insert",
    event_json: { series_key, inserted_id: inserted.id },
  });

  return Response.json({ ok: true, inserted });
}
