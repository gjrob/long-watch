import { createClient } from "@supabase/supabase-js";

/**
 * Reads an env var and trims it.
 *
 * The trim is not cosmetic: SUPABASE_URL is currently stored in Vercel with a
 * leading space (" https://…", 41 chars where the URL is 40). supabase-js
 * happens to tolerate that today, but a stray space or newline in a pasted
 * env value is a recurring failure mode in this codebase and it should never
 * reach a client constructor.
 */
function requireEnv(name: string) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is missing (check .env.local and Vercel env vars; restart dev server)`);
  return v;
}

export function supabaseAnonServer() {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const anonKey = requireEnv("SUPABASE_ANON_KEY");
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });
}

export function supabaseServiceServer() {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}
