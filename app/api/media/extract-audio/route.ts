import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import crypto from "node:crypto";
import { validateInputPath, ensureDir } from "@/src/utils/paths";
import { spawnSafe, resolveFfmpegPath } from "@/src/utils/process";
import { MediaService } from "@/src/services/media.service";
import { env } from "@/src/config/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawInputPath = body.inputPath || body.mediaPath;
    const format = body.format || "mp3";

    if (!rawInputPath || typeof rawInputPath !== "string") {
      return NextResponse.json({ error: "inputPath or mediaPath is required" }, { status: 400 });
    }

    const inputPath = validateInputPath(rawInputPath);
    const mediaMeta = await MediaService.inspectMedia(inputPath);

    if (!mediaMeta.hasAudio) {
      return NextResponse.json(
        { error: "The selected video does not contain an audio stream to extract." },
        { status: 400 }
      );
    }

    const outputDir = ensureDir(env.outputDir);
    const audioExt = format === "wav" ? "wav" : "mp3";
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const audioFileName = `${baseName}_audio_${crypto.randomUUID().slice(0, 8)}.${audioExt}`;
    const outputPath = path.join(outputDir, audioFileName);

    const ffmpegPath = resolveFfmpegPath();
    const args = ["-y", "-i", inputPath, "-vn"];

    if (audioExt === "wav") {
      args.push("-acodec", "pcm_s16le", outputPath);
    } else {
      args.push("-acodec", "libmp3lame", "-b:a", "192k", outputPath);
    }

    await spawnSafe(ffmpegPath, args);

    const audioMeta = await MediaService.inspectMedia(outputPath);

    return NextResponse.json({
      success: true,
      audioPath: outputPath,
      fileName: audioFileName,
      durationSeconds: audioMeta.durationSeconds,
      format: audioExt,
      streamUrl: `/api/media/stream?path=${encodeURIComponent(outputPath)}`,
      downloadUrl: `/api/media/stream?path=${encodeURIComponent(outputPath)}&download=true&filename=${encodeURIComponent(audioFileName)}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
