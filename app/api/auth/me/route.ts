import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/src/services/auth.service";
import { DbService } from "@/src/services/db.service";

export async function GET(request: NextRequest) {
  try {
    const session = await AuthService.getUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const userRecord = DbService.findUserById(session.userId);
    if (!userRecord) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
