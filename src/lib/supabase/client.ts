import { createClient } from "@supabase/supabase-js";

let browserClient: any = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http") &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 20
  );
}

export function getSupabaseBrowserClient(): any {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    // Dynamically require SSR client if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createBrowserClient } = require("@supabase/ssr");
    browserClient = createBrowserClient(url, anonKey);
    return browserClient;
  } catch {
    browserClient = createClient(url, anonKey);
    return browserClient;
  }
}
