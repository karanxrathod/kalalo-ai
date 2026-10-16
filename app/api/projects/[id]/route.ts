import { NextRequest, NextResponse } from "next/server";
import { ProjectsService } from "@/src/services/projects.service";
import { AuthService } from "@/src/services/auth.service";
import { SupabaseService } from "@/src/services/supabase.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await AuthService.getUserFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await ProjectsService.getProjectAsync(params.id, session.userId);
    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Refresh signed streaming URL if project has storagePath in Supabase Storage
    if (project.storagePath && (!project.streamUrl || !project.streamUrl.includes("token="))) {
      const signedUrl = await SupabaseService.getSignedMediaUrl(project.storagePath, 3600);
      if (signedUrl) {
        project.streamUrl = signedUrl;
      }
    }

    return NextResponse.json({ project });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await AuthService.getUserFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updated = await ProjectsService.updateProjectAsync(params.id, body, session.userId);
    if (!updated) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }
    return NextResponse.json({ project: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await AuthService.getUserFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await ProjectsService.deleteProjectAsync(params.id, session.userId);
    if (!success) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const PUT = PATCH;
