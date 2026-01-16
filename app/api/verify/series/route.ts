import crypto from "crypto";
import { supabaseAnonServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Must match the canonical hashing rules used by your writer (cron).
 * - stable JSON stringify (key-sorted)
 * - canonical string: observed_at | signal_type | series_key | source | stable(value_json) | prev_hash
 */
function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(stableStringify).join(",") + "]";

  const rec = obj as Record<string, unknown>;
  const keys = Object.keys(rec).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + stableStringify(rec[k]))
      .join(",") +
    "}"
  );
}

function hashRow(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function computeRowHash(row: {
  observed_at: string;
  signal_type: string;
  series_key: string;
  source: string;
  value_json: unknown;
  prev_hash: string | null;
}): string {
  // Normalize to the writer’s format (Date.toISOString() -> ends with "Z")
  const observedISO = new Date(row.observed_at).toISOString();

  const canonical = [
    observedISO,
    row.signal_type,
    row.series_key,
    row.source,
    stableStringify(row.value_json),
    row.prev_hash ?? "",
  ].join("|");

  return hashRow(canonical);
}


export async function GET(req: Request) {
  const url = new URL(req.url);
  const series_key = url.searchParams.get("series_key") ?? "lw.core.heartbeat";
  const limitRaw = Number(url.searchParams.get("limit") ?? 500);
  const limit = Math.min(Math.max(limitRaw, 2), 2000);

  const supabase = supabaseAnonServer();

  // Pull the newest N rows, then verify in chronological order (ascending)
  const { data, error } = await supabase
    .from("signals")
    .select(
      "id, observed_at, ingested_at, signal_type, series_key, source, value_json, prev_hash, row_hash, is_public, period_key"
    )
    .eq("is_public", true)
    .eq("series_key", series_key)
    .order("observed_at", { ascending: false })
    .limit(limit);

  if (error) {
    return Response.json(
      { ok: false, error: "db_read_failed", detail: error.message },
      { status: 500 }
    );
  }

  const rowsDesc = data ?? [];
  if (rowsDesc.length === 0) {
    return Response.json({
      ok: true,
      series_key,
      verified: false,
      reason: "no_rows",
      count: 0,
    });
  }

  const rows = [...rowsDesc].sort(
    (a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime()
  );

  // Verify:
  // A) row_hash recomputation
  // B) prev_hash chain continuity inside this window
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];

    const expectedRowHash = computeRowHash({
      observed_at: r.observed_at,
      signal_type: r.signal_type,
      series_key: r.series_key,
      source: r.source,
      value_json: r.value_json,
      prev_hash: r.prev_hash ?? null,
    });

    if (r.row_hash !== expectedRowHash) {
      return Response.json({
        ok: true,
        series_key,
        verified: false,
        reason: "row_hash_mismatch",
        at_index: i,
        at_id: r.id,
        observed_at: r.observed_at,
        expected_row_hash: expectedRowHash,
        actual_row_hash: r.row_hash,
      });
    }

    if (i > 0) {
      const prev = rows[i - 1];
      const expectedPrevHash = prev.row_hash;

      if ((r.prev_hash ?? null) !== expectedPrevHash) {
        return Response.json({
          ok: true,
          series_key,
          verified: false,
          reason: "prev_hash_chain_break",
          at_index: i,
          at_id: r.id,
          observed_at: r.observed_at,
          expected_prev_hash: expectedPrevHash,
          actual_prev_hash: r.prev_hash ?? null,
          prev_row_id: prev.id,
          prev_row_observed_at: prev.observed_at,
        });
      }
    }
  }

  // If we verified a window, it's internally consistent.
  // Note: the oldest row in the window may have a prev_hash that points to a row older than the window.
  return Response.json({
    ok: true,
    series_key,
    verified: true,
    count: rows.length,
    window: {
      oldest_observed_at: rows[0].observed_at,
      newest_observed_at: rows[rows.length - 1].observed_at,
    },
    head: {
      newest_id: rows[rows.length - 1].id,
      newest_row_hash: rows[rows.length - 1].row_hash,
      newest_prev_hash: rows[rows.length - 1].prev_hash ?? null,
    },
  });
}
