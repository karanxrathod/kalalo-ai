import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { ensureDir } from "@/src/utils/paths";
import { MediaService } from "@/src/services/media.service";
import { ProjectsService } from "@/src/services/projects.service";
import { ProviderFactory } from "@/src/services/transcription/provider.factory";
import { SettingsService } from "@/src/services/settings.service";
import { AuthService } from "@/src/services/auth.service";
import { SupabaseService } from "@/src/services/supabase.service";
import { TranscriptionLanguage } from "@/src/types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await AuthService.getUserFromRequest(request);
    const userId = session?.userId;
    const effectiveUserId = userId || "usr_creator_default";

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const autoTranscribe = formData.get("autoTranscribe") !== "false";
    const languageParam = (formData.get("language") as string) || "auto";
    const providerParam = (formData.get("provider") as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const maxSizeBytes = 250 * 1024 * 1024; // 250MB limit
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ error: "File exceeds 250MB upload limit" }, { status: 400 });
    }

    const baseDir = process.env.VERCEL ? "/tmp" : process.cwd();
    const uploadsDir = ensureDir(path.resolve(baseDir, "tmp", "uploads"));
    const safeExt = path.extname(file.name) || ".mp4";
    const safeName = `upload-${crypto.randomUUID()}${safeExt}`;
    const targetPath = path.join(uploadsDir, safeName);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(targetPath, Buffer.from(arrayBuffer));

    const clientDuration = formData.get("duration") ? parseFloat(formData.get("duration") as string) : undefined;
    const clientWidth = formData.get("width") ? parseInt(formData.get("width") as string, 10) : undefined;
    const clientHeight = formData.get("height") ? parseInt(formData.get("height") as string, 10) : undefined;

    let metadata;
    try {
      metadata = await MediaService.inspectMedia(targetPath);
    } catch {
      metadata = {
        format: safeExt.replace(".", "") || "mp4",
        durationSeconds: clientDuration || 30,
        hasAudio: true,
        hasVideo: true,
        sizeBytes: file.size,
        video: {
          width: clientWidth || 1080,
          height: clientHeight || 1920,
          codec: "h264",
        },
      };
    }

    if (clientDuration && clientDuration > 0 && (!metadata.durationSeconds || metadata.durationSeconds <= 0)) {
      metadata.durationSeconds = clientDuration;
    }
    if (clientWidth && clientHeight && (!metadata.video?.width || metadata.video.width <= 0)) {
      metadata.video = {
        codec: metadata.video?.codec || "h264",
        width: clientWidth,
        height: clientHeight,
        aspectRatio: clientHeight > clientWidth ? "9:16" : clientWidth > clientHeight ? "16:9" : "1:1",
      };
    }

    const publicSettings = SettingsService.getPublicSettings(userId);
    const chosenProvider = providerParam || publicSettings.provider || "gemini";
    const chosenLanguage = (languageParam || publicSettings.language || "auto") as TranscriptionLanguage;

    let storagePath: string | undefined = undefined;
    let fileUrl: string | undefined = undefined;

    if (SupabaseService.isEnabled()) {
      const storageUpload = await SupabaseService.uploadMediaToStorage(
        effectiveUserId,
        safeName.replace(/\.[^/.]+$/, ""),
        file.name,
        Buffer.from(arrayBuffer),
        file.type || "video/mp4"
      );
      if (storageUpload) {
        storagePath = storageUpload.storagePath;
        fileUrl = storageUpload.publicUrl;
      }
    }

    // Create project in persistent store (Supabase or local DB)
    const project = await ProjectsService.createProjectAsync({
      userId,
      name: file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      filePath: targetPath,
      storagePath,
      fileUrl,
      durationSeconds: metadata.durationSeconds,
      width: metadata.video?.width || 1080,
      height: metadata.video?.height || 1920,
      aspectRatio: metadata.video?.height && metadata.video.width ? (metadata.video.height > metadata.video.width ? "9:16" : metadata.video.width > metadata.video.height ? "16:9" : "1:1") : "9:16",
      language: chosenLanguage,
      provider: chosenProvider as any,
    });

    let segments = [];
    let transcriptionError: string | null = null;
    let detectedLanguage: string | undefined = undefined;

    // If autoTranscribe requested and media has audio, run transcription
    if (autoTranscribe && metadata.hasAudio) {
      try {
        const sttProvider = ProviderFactory.getProvider(chosenProvider);
        const result = await sttProvider.transcribe({
          inputPath: targetPath,
          language: chosenLanguage,
        });

        segments = result.segments;
        detectedLanguage = result.detectedLanguage;

        // Update project with real segments
        await ProjectsService.updateProjectAsync(project.id, {
          segments,
          status: "ready_to_edit",
          language: (detectedLanguage as any) || chosenLanguage,
        }, userId);
      } catch (sttErr: unknown) {
        transcriptionError = sttErr instanceof Error ? sttErr.message : String(sttErr);
        await ProjectsService.updateProjectAsync(project.id, {
          status: "uploaded",
          error: transcriptionError,
        }, userId);
      }
    }

    const updatedProject = (await ProjectsService.getProjectAsync(project.id, userId)) || project;
    if (fileUrl && (!updatedProject.streamUrl || updatedProject.streamUrl.startsWith("/api/media/stream"))) {
      updatedProject.streamUrl = fileUrl;
    }

    return NextResponse.json({
      success: true,
      project: updatedProject,
      projectId: updatedProject.id,
      filePath: targetPath,
      fileName: file.name,
      fileSize: file.size,
      streamUrl: updatedProject.streamUrl,
      media: metadata,
      segments: updatedProject.segments,
      transcriptionError,
      status: updatedProject.status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
