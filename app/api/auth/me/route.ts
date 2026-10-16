import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/src/services/auth.service";
import { DbService } from "@/src/services/db.service";
import { isSupabaseConfigured } from "@/src/lib/supabase/client";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/src/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const session = await AuthService.getUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    let displayName = session.name;
    let avatarUrl: string | null = null;
    let createdAt: string = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdminClient() || getSupabaseServerClient();
      if (supabase) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.userId)
          .single();

        if (profile) {
          displayName = profile.display_name || profile.full_name || displayName;
          avatarUrl = profile.avatar_url || null;
          if (profile.created_at) createdAt = profile.created_at;
        }
      }
    } else {
      const userRecord = DbService.findUserById(session.userId);
      if (userRecord) {
        displayName = userRecord.name;
        createdAt = userRecord.createdAt;
      }
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        name: displayName,
        avatarUrl,
        createdAt,
        role: "creator",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await AuthService.getUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, avatarUrl } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Display name cannot be empty" }, { status: 400 });
    }

    const updatedName = name.trim();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdminClient() || getSupabaseServerClient();
      if (supabase) {
        await supabase.from("profiles").upsert(
          {
            id: session.userId,
            display_name: updatedName,
            avatar_url: avatarUrl || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      }
    }

    // Refresh JWT session token with updated name
    const newToken = await AuthService.createToken({
      id: session.userId,
      email: session.email,
      name: updatedName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        email: session.email,
        name: updatedName,
        avatarUrl,
        role: "creator",
      },
    });

    AuthService.attachSessionCookie(response, newToken);
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

