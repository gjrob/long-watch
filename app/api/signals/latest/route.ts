export const runtime = 'nodejs';

export async function GET() {
  return Response.json({
    observed_at: new Date().toISOString(),
    signal_value: 100,
    temperature_value: 20,
    environment_value: 0.5,
    integrity_flag: true,
    batch_hash: 'placeholder',
  });
}
