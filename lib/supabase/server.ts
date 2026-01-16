import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string) {
  const v = process.env[name];
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
