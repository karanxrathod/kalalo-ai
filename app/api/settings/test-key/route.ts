import { NextRequest, NextResponse } from "next/server";
import { SettingsService } from "@/src/services/settings.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const keyToTest = body.apiKey;
    const modelToTest = body.model;

    const result = await SettingsService.testGeminiConnection(keyToTest, modelToTest);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
