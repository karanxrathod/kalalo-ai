import { NextRequest, NextResponse } from "next/server";
import { ProjectsService } from "@/src/services/projects.service";
import { ProviderFactory } from "@/src/services/transcription/provider.factory";
import { SettingsService } from "@/src/services/settings.service";
import { TranscriptionLanguage } from "@/src/types";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = ProjectsService.getProject(params.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const publicSettings = SettingsService.getPublicSettings();
    const providerName = body.provider || project.provider || publicSettings.provider || "gemini";
    const language = (body.language || project.language || publicSettings.language || "auto") as TranscriptionLanguage;

    ProjectsService.updateProject(project.id, {
      status: "transcribing",
      error: undefined,
    });

    try {
      const sttProvider = ProviderFactory.getProvider(providerName);
      const result = await sttProvider.transcribe({
        inputPath: project.filePath,
        language,
        apiKey: body.apiKey,
        model: body.model,
      });

      const updated = ProjectsService.updateProject(project.id, {
        segments: result.segments,
        status: "ready_to_edit",
        provider: providerName as any,
        language: (result.detectedLanguage as any) || language,
      });

      return NextResponse.json({
        success: true,
        project: updated,
        segments: result.segments,
        detectedLanguage: result.detectedLanguage,
      });
    } catch (sttErr: unknown) {
      const errorMsg = sttErr instanceof Error ? sttErr.message : String(sttErr);
      ProjectsService.updateProject(project.id, {
        status: "failed",
        error: errorMsg,
      });
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
