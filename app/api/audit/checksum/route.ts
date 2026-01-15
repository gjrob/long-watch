export const runtime = 'nodejs';

export async function GET() {
  return Response.json({
    snapshot_date: new Date().toISOString().slice(0, 10),
    row_count: 0,
    checksum: 'placeholder',
    created_at: new Date().toISOString(),
  });
}
