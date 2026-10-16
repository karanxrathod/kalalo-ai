import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { ProjectsService } from "@/src/services/projects.service";
import { ProviderFactory } from "@/src/services/transcription/provider.factory";
import { SettingsService } from "@/src/services/settings.service";
import { AuthService } from "@/src/services/auth.service";
import { SupabaseService } from "@/src/services/supabase.service";
import { ensureLocalMediaFile } from "@/src/utils/paths";
import { TranscriptionLanguage } from "@/src/types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const publicSettings = SettingsService.getPublicSettings(session.userId);
    const providerName = body.provider || project.provider || publicSettings.provider || "gemini";
    const language = (body.language || project.language || publicSettings.language || "auto") as TranscriptionLanguage;

    await ProjectsService.updateProjectAsync(project.id, {
      status: "transcribing",
      error: undefined,
    }, session.userId);

    // Resolve media input path: local file or Supabase Storage download
    let mediaInput = project.filePath;
    let cleanupCallback: (() => Promise<void>) | null = null;

    if (!mediaInput || !fs.existsSync(mediaInput)) {
      let downloadUrl = project.streamUrl;
      if (project.storagePath) {
        const signed = await SupabaseService.getSignedMediaUrl(project.storagePath, 3600);
        if (signed) downloadUrl = signed;
      }

      if (downloadUrl && downloadUrl.startsWith("http")) {
        const local = await ensureLocalMediaFile(downloadUrl);
        mediaInput = local.localPath;
        cleanupCallback = local.cleanup;
      }
    }

    if (!mediaInput || !fs.existsSync(mediaInput)) {
      await ProjectsService.updateProjectAsync(project.id, {
        status: "failed",
        error: "Media source file not found or inaccessible for transcription",
      }, session.userId);
      return NextResponse.json({ error: "Media file not found in storage" }, { status: 404 });
    }

    try {
      const sttProvider = ProviderFactory.getProvider(providerName);
      const result = await sttProvider.transcribe({
        inputPath: mediaInput,
        language,
        apiKey: body.apiKey,
        model: body.model,
      });

      const updated = await ProjectsService.updateProjectAsync(project.id, {
        segments: result.segments,
        status: "ready_to_edit",
        provider: providerName as any,
        language: (result.detectedLanguage as any) || language,
      }, session.userId);

      return NextResponse.json({
        success: true,
        project: updated,
        segments: result.segments,
        detectedLanguage: result.detectedLanguage,
      });
    } catch (sttErr: unknown) {
      const errorMsg = sttErr instanceof Error ? sttErr.message : String(sttErr);
      await ProjectsService.updateProjectAsync(project.id, {
        status: "failed",
        error: errorMsg,
      }, session.userId);
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    } finally {
      if (cleanupCallback) {
        await cleanupCallback();
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

