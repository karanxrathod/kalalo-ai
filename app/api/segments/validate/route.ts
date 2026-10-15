import { NextRequest, NextResponse } from "next/server";
import { CaptionsService } from "@/src/services/captions.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { segments, durationSeconds } = body;

    const result = CaptionsService.validateSegments(segments, durationSeconds);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { valid: false, errors: [err instanceof Error ? err.message : String(err)] },
      { status: 400 }
    );
  }
}
