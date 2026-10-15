import { NextRequest, NextResponse } from "next/server";
import { SettingsService } from "@/src/services/settings.service";
import { AuthService } from "@/src/services/auth.service";

export async function GET(request: NextRequest) {
  try {
    const session = await AuthService.getUserFromRequest(request);
    const userId = session?.userId || "usr_creator_default";
    const settings = SettingsService.getPublicSettings(userId);
    return NextResponse.json(settings);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await AuthService.getUserFromRequest(request);
    const userId = session?.userId || "usr_creator_default";
    const body = await request.json();

    if (body.geminiApiKey !== undefined) {
      if (body.geminiApiKey === "") {
        SettingsService.removeGeminiApiKey(userId);
      } else {
        SettingsService.saveGeminiApiKey(body.geminiApiKey, userId);
      }
    }

    if (
      body.defaultProvider ||
      body.defaultModel ||
      body.defaultLanguage ||
      body.defaultAspectRatio ||
      body.defaultPreset
    ) {
      SettingsService.savePreferences(
        {
          defaultProvider: body.defaultProvider,
          defaultModel: body.defaultModel,
          defaultLanguage: body.defaultLanguage,
          defaultAspectRatio: body.defaultAspectRatio,
          defaultPreset: body.defaultPreset,
        },
        userId
      );
    }

    const updated = SettingsService.getPublicSettings(userId);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await AuthService.getUserFromRequest(request);
    const userId = session?.userId || "usr_creator_default";
    SettingsService.removeGeminiApiKey(userId);
    const updated = SettingsService.getPublicSettings(userId);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}

