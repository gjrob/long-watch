export interface ThreadEntry {
  id: number;
  content: string;
}

/**
 * Build a numbered thread from an array of tweet texts.
 */
export function buildThread(tweets: string[]): ThreadEntry[] {
  return tweets.map((text, i) => ({
    id: i + 1,
    content: text,
  }));
}
