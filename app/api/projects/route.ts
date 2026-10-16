import { NextRequest, NextResponse } from "next/server";
import { ProjectsService } from "@/src/services/projects.service";
import { AuthService } from "@/src/services/auth.service";

export async function GET(request: NextRequest) {
  try {
    const session = await AuthService.getUserFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const projects = await ProjectsService.listProjectsAsync(session.userId);
    return NextResponse.json({ projects });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await AuthService.getUserFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const project = await ProjectsService.createProjectAsync({
      ...body,
      userId: session.userId,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
