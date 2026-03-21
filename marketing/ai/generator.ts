import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a concise social media writer for a nuclear accountability and long-duration verification project called "The Long Watch."

Rules:
- Write exactly ONE tweet (max 280 characters)
- No hashtags unless the caller requests them
- No emojis
- Calm, precise, authoritative tone
- Never sensationalize
- Never use "breaking" or "alert"
- Match the framing angle if one is provided (Problem, Solution, or CTA)`;

/**
 * Generate a single tweet using Claude.
 *
 * Falls back to a deterministic stub if ANTHROPIC_API_KEY is not set,
 * so the system remains functional in development without credentials.
 */
export async function generateTweet(
  theme: string,
  context: Record<string, unknown>,
  frame?: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Fallback: no API key → deterministic stub
  if (!apiKey) {
    const ctx = Object.entries(context)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
    const prefix = frame ? `[${frame}] ` : '';
    return `${prefix}${theme} — ${ctx}`;
  }

  const client = new Anthropic({ apiKey });

  const ctx = Object.entries(context)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const frameInstruction = frame
    ? `\nFraming angle: ${frame}`
    : '';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 120,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Theme: ${theme}\nContext: ${ctx}${frameInstruction}\n\nWrite the tweet.`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return block.text.trim();
}
