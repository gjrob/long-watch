import { getAllAnchors } from '@/lib/anchorStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public verification endpoint.
 * Returns all persisted real anchors in raw form.
 * No formatting. No filtering. Enables independent verification
 * without the dashboard UI.
 *
 * Read-only. Append-only source table.
 */
export async function GET() {
  try {
    const anchors = await getAllAnchors();

    return Response.json({
      ok: true,
      count: anchors.length,
      anchors,
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown';
    return Response.json(
      { ok: false, error: 'db_read_failed', detail: message },
      { status: 500 },
    );
  }
}
