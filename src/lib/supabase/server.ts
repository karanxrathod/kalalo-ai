import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./client.js";

/**
 * Creates an authenticated Supabase server client bound to Next.js cookies if in Next.js environment.
 */
export function getSupabaseServerClient(): any {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    // Dynamically access next/headers and @supabase/ssr in Next.js environments
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nextHeaders = require("next/headers");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createServerClient } = require("@supabase/ssr");
    const cookieStore = nextHeaders.cookies();

    return createServerClient(url, anonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Can occur in Server Components where cookies cannot be mutated
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // Can occur in Server Components where cookies cannot be mutated
          }
        },
      },
    });
  } catch {
    return createClient(url, anonKey);
  }
}

/**
 * Creates an administrative Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Strictly server-side only. Used for background jobs and media provisioning.
 */
export function getSupabaseAdminClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceRoleKey || !url.startsWith("http")) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
