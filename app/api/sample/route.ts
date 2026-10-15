import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { MediaService } from "@/src/services/media.service";

export async function GET() {
  try {
    const samplePath = path.resolve(process.cwd(), "samples", "sample-video.mp4");

    if (!fs.existsSync(samplePath)) {
      return NextResponse.json(
        { error: "Sample video not generated yet. Run npm run generate:sample" },
        { status: 404 }
      );
    }

    const meta = await MediaService.inspectMedia(samplePath);

    return NextResponse.json({
      samplePath,
      fileName: "sample-video.mp4",
      streamUrl: `/api/media/stream?path=${encodeURIComponent(samplePath)}`,
      media: meta,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
