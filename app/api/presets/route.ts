import { NextRequest, NextResponse } from "next/server";
import { PresetsService } from "@/src/presets/presets";
import { AspectRatio, SupportedLanguage } from "@/src/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") as AspectRatio | undefined;
    const language = searchParams.get("language") as SupportedLanguage | undefined;

    const presets = PresetsService.listPresets({ format, language });
    return NextResponse.json({ presets });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
