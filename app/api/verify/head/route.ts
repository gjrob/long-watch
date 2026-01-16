import crypto from "crypto";
import { supabaseAnonServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(stableStringify).join(",") + "]";

  const rec = obj as Record<string, unknown>;
  const keys = Object.keys(rec).sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + stableStringify(rec[k])).join(",") +
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
  // Canonicalize timestamp to match writer format
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

  const supabase = supabaseAnonServer();

  const { data, error } = await supabase
    .from("signals")
    .select("id, observed_at, signal_type, series_key, source, value_json, prev_hash, row_hash, is_public, period_key")
    .eq("is_public", true)
    .eq("series_key", series_key)
    .order("observed_at", { ascending: false })
    .limit(2);

  if (error) {
    return Response.json(
      { ok: false, error: "db_read_failed", detail: error.message },
      { status: 500 }
    );
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return Response.json({ ok: true, series_key, verified: false, reason: "no_rows" });
  }

  const newest = rows[0];
  const prev = rows.length > 1 ? rows[1] : null;

  // Verify newest row hash
  const expectedNewestHash = computeRowHash({
    observed_at: newest.observed_at,
    signal_type: newest.signal_type,
    series_key: newest.series_key,
    source: newest.source,
    value_json: newest.value_json,
    prev_hash: newest.prev_hash ?? null,
  });

  if (newest.row_hash !== expectedNewestHash) {
    return Response.json({
      ok: true,
      series_key,
      verified: false,
      reason: "row_hash_mismatch",
      newest: {
        id: newest.id,
        observed_at: newest.observed_at,
        expected_row_hash: expectedNewestHash,
        actual_row_hash: newest.row_hash,
      },
    });
  }

  // If we have a predecessor, verify chain link
  if (prev) {
    if ((newest.prev_hash ?? null) !== prev.row_hash) {
      return Response.json({
        ok: true,
        series_key,
        verified: false,
        reason: "prev_hash_chain_break",
        newest: {
          id: newest.id,
          observed_at: newest.observed_at,
          expected_prev_hash: prev.row_hash,
          actual_prev_hash: newest.prev_hash ?? null,
        },
        prev: {
          id: prev.id,
          observed_at: prev.observed_at,
          row_hash: prev.row_hash,
        },
      });
    }
  }

  return Response.json({
    ok: true,
    series_key,
    verified: true,
    head: {
      newest_id: newest.id,
      newest_observed_at: newest.observed_at,
      newest_row_hash: newest.row_hash,
      newest_prev_hash: newest.prev_hash ?? null,
      newest_period_key: newest.period_key ?? null,
      has_prev: !!prev,
    },
  });
}
