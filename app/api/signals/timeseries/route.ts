export const runtime = 'nodejs';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = clamp(Number(searchParams.get('days') ?? 30), 1, 365);

  // Placeholder time series: one point per hour
  const now = Date.now();
  const points: Array<{
    observed_at: string;
    signal_value: number;
    temperature_value: number;
    environment_value: number;
    integrity_flag: boolean;
    batch_hash: string;
  }> = [];

  const hours = days * 24;
  for (let i = hours; i >= 0; i--) {
    const t = now - i * 60 * 60 * 1000;
    const signal = 100 - i * 0.001;
    const temperature = 20 + Math.sin(i / 24) * 2;
    const environment = 0.5 + Math.sin(i / 48) * 0.05;

    points.push({
      observed_at: new Date(t).toISOString(),
      signal_value: signal,
      temperature_value: temperature,
      environment_value: environment,
      integrity_flag: true,
      batch_hash: 'placeholder',
    });
  }

  return Response.json({ days, points });
}
