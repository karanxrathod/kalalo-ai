import { NextRequest, NextResponse } from "next/server";
import { MediaService } from "@/src/services/media.service";
import { KalaloError } from "@/src/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inputPath } = body;

    if (!inputPath || typeof inputPath !== "string") {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "inputPath is required" } },
        { status: 400 }
      );
    }

    const metadata = await MediaService.inspectMedia(inputPath);
    return NextResponse.json({
      media: metadata,
      video: metadata.video,
      audio: metadata.audio,
      durationSeconds: metadata.durationSeconds,
      hasAudio: metadata.hasAudio,
      hasVideo: metadata.hasVideo,
    });
  } catch (err: unknown) {
    if (err instanceof KalaloError) {
      return NextResponse.json({ error: err.toJSON() }, { status: 400 });
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: err instanceof Error ? err.message : String(err) } },
      { status: 500 }
    );
  }
}
