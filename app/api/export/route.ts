import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import crypto from "node:crypto";
import { SubtitleExportService } from "@/src/services/subtitle-export.service";
import { ensureDir } from "@/src/utils/paths";
import { env } from "@/src/config/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { segments, format = "srt", saveToDisk = true } = body;

    let outputPath: string | undefined;
    if (saveToDisk) {
      const outDir = ensureDir(env.outputDir);
      outputPath = path.join(outDir, `subtitles-${crypto.randomUUID()}.${format}`);
    }

    const result = await SubtitleExportService.exportSubtitles(segments, format, outputPath);

    return NextResponse.json({
      ...result,
      downloadUrl: result.outputPath
        ? `/api/media/stream?path=${encodeURIComponent(result.outputPath)}&download=true&filename=kalalo-subtitles.${format}`
        : undefined,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
