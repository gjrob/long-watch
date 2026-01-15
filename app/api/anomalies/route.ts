export const runtime = 'nodejs';

export async function GET() {
  return Response.json({
    items: [
      {
        detected_at: new Date().toISOString(),
        sigma: 2.4,
        status: 'resolved',
      },
    ],
  });
}
