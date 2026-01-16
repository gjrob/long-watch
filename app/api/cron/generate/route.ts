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
function periodKey1Min(d: Date) {
  const bucket = Math.floor(d.getTime() / (60 * 1000));
  return `1m:${bucket}`;
}
function hashRow(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}
async function httpProbe(url: string) {
  const start = Date.now();

  const controller = new AbortController();
  const timeoutMs = 5000; // 5s hard cap
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "user-agent": "longwatch/cron:v1",
      },
    });

    const latency_ms = Date.now() - start;

    return {
      ok: true as const,
      url,
      status: res.status,
      latency_ms,
      timeout_ms: timeoutMs,
    };
  } catch (e: any) {
    const latency_ms = Date.now() - start;

    return {
      ok: false as const,
      url,
      status: null,
      latency_ms,
      timeout_ms: timeoutMs,
      error: String(e?.name === "AbortError" ? "timeout" : (e?.message ?? e)),
    };
  } finally {
    clearTimeout(t);
  }
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
const period_key = periodKey1Min(now);

const probeUrl = process.env.LONGWATCH_PROBE_URL || "https://longwatch.win";
const probe = await httpProbe(probeUrl);

// Define series payloads for this run
const seriesWrites = [
  {
    series_key: "lw.core.heartbeat",
    signal_type: "snapshot",
    source: "cron:v1",
    value_json: { kind: "heartbeat", note: "scheduled observation" },
    meta_json: { version: 2 },
    is_public: true,
  },
  {
    series_key: "lw.external.http_probe",
    signal_type: "snapshot",
    source: "cron:v1",
    value_json: probe,
    meta_json: { version: 1 },
    is_public: true,
  },
] as const;

const insertedRows: any[] = [];
const deduped: any[] = [];

for (const w of seriesWrites) {
  // fetch last row_hash for THIS series to chain correctly
  const { data: last, error: lastErr } = await supabase
    .from("signals")
    .select("row_hash")
    .eq("series_key", w.series_key)
    .order("observed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) {
    return Response.json(
      { ok: false, error: "db_read_failed", detail: lastErr.message, series_key: w.series_key },
      { status: 500 }
    );
  }

  const prev_hash = last?.row_hash ?? null;

  const canonical = [
    observed_at,
    w.signal_type,
    w.series_key,
    w.source,
    stableStringify(w.value_json),
    prev_hash ?? "",
  ].join("|");

  const row_hash = hashRow(canonical);

  const { data: inserted, error: insErr } = await supabase
    .from("signals")
    .insert({
      observed_at,
      signal_type: w.signal_type,
      series_key: w.series_key,
      source: w.source,
      value_json: w.value_json,
      meta_json: w.meta_json,
      is_public: w.is_public,
      prev_hash,
      row_hash,
      period_key,
    })
    .select("id, series_key, observed_at, row_hash, prev_hash, period_key")
    .single();

  if (insErr) {
    // unique violation => already written this period for this series
    if ((insErr as any).code === "23505") {
      deduped.push({ series_key: w.series_key, period_key });
      continue;
    }
    return Response.json(
      { ok: false, error: "db_write_failed", detail: insErr.message, series_key: w.series_key },
      { status: 500 }
    );
  }

  insertedRows.push(inserted);
}

return Response.json({
  ok: true,
  observed_at,
  period_key,
  inserted: insertedRows,
  deduped,
});


}