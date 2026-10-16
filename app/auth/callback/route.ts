import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/src/lib/supabase/server";
import { AuthService } from "@/src/services/auth.service";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user) {
        const user = data.user;
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Creator";
        const email = user.email || "";

        // Sync with profiles table
        const admin = getSupabaseAdminClient() || supabase;
        await admin.from("profiles").upsert(
          {
            id: user.id,
            display_name: name,
            avatar_url: user.user_metadata?.avatar_url || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        // Create JWT token and attach session cookie
        const token = await AuthService.createToken({
          id: user.id,
          email,
          name,
        });

        const response = NextResponse.redirect(new URL(next, requestUrl.origin));
        AuthService.attachSessionCookie(response, token);
        return response;
      }
    }
  }

  // Fallback redirect if no code or error
  return NextResponse.redirect(new URL("/login?error=oauth_failed", requestUrl.origin));
}
