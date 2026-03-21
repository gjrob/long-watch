import { generateTweet } from '@/marketing/ai';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { theme, context, frame } = body;

    if (!theme || typeof theme !== 'string') {
      return Response.json(
        { ok: false, error: 'missing_theme', detail: 'theme is required (string)' },
        { status: 400 },
      );
    }

    const tweet = await generateTweet(theme, context ?? {}, frame);

    return Response.json({ ok: true, tweet });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown';
    return Response.json(
      { ok: false, error: 'generation_failed', detail: message },
      { status: 500 },
    );
  }
}
