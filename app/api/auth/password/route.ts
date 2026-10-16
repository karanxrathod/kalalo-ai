import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/src/services/auth.service";
import { isSupabaseConfigured } from "@/src/lib/supabase/client";
import { getSupabaseAdminClient } from "@/src/lib/supabase/server";
import { DbService } from "@/src/services/db.service";

export async function POST(request: NextRequest) {
  try {
    const session = await AuthService.getUserFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        const { error } = await supabase.auth.admin.updateUserById(session.userId, {
          password,
        });
        if (error) {
          throw new Error(error.message || "Failed to update password in auth provider");
        }
      }
    } else {
      const updated = DbService.updateUserPassword(session.userId, password);
      if (!updated) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
