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
/**
 * 10-minute observation bucket.
 *
 * This MUST stay at 10 minutes: every historical row uses it. The January
 * tail carries period_key "10m:2947636", and 2947636 * 600000ms resolves to
 * 2026-01-16T16:40:00Z — the exact bucket of the last real observation. A
 * 1-minute key here would break continuity with everything already written
 * and write 1440 rows/day against a uniqueness constraint built for 144.
 */
function periodKey10Min(d: Date) {
  const bucket = Math.floor(d.getTime() / (10 * 60 * 1000));
  return `10m:${bucket}`;
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
  } catch (e: unknown) {
    const latency_ms = Date.now() - start;
    const errorDetails =
      typeof e === "object" && e !== null
        ? (e as { name?: unknown; message?: unknown })
        : undefined;

    return {
      ok: false as const,
      url,
      status: null,
      latency_ms,
      timeout_ms: timeoutMs,
      error: String(
        errorDetails?.name === "AbortError"
          ? "timeout"
          : (errorDetails?.message ?? e)
      ),
    };
  } finally {
    clearTimeout(t);
  }
}


export const runtime = "nodejs";

/** Constant-time compare so the secret can't be probed by response timing. */
function secretMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  // Vercel cron authenticates with `Authorization: Bearer <CRON_SECRET>`.
  // The previous implementation read only `x-cron-secret` and `?token=`, so
  // every scheduled invocation 401'd — ~every minute since January. The
  // `?token=` form is gone deliberately: it wrote the secret into Vercel's
  // access log on every request.
  const expected = (process.env.CRON_SECRET ?? "").trim();
  if (!expected) {
    return Response.json(
      { ok: false, error: "server_misconfigured", detail: "CRON_SECRET is not set" },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const headerSecret = (req.headers.get("x-cron-secret") ?? "").trim();
  const presented = bearer || headerSecret;

  if (!presented || !secretMatches(presented, expected)) {
    return Response.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const supabase = supabaseServiceServer();

const now = new Date();
const observed_at = now.toISOString();
const period_key = periodKey10Min(now);

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

type InsertedSignal = {
  id: string;
  series_key: (typeof seriesWrites)[number]["series_key"];
  observed_at: string;
  row_hash: string;
  prev_hash: string | null;
  period_key: string;
};
const insertedRows: InsertedSignal[] = [];
const deduped: Array<{
  series_key: (typeof seriesWrites)[number]["series_key"];
  period_key: string;
}> = [];

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
    if (insErr.code === "23505") {
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
