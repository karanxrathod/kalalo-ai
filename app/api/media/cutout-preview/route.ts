import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import { CutoutService } from "@/src/services/cutout.service";
import { ensureDir } from "@/src/utils/paths";
import { env } from "@/src/config/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inputPath } = body;

    if (!inputPath || !fs.existsSync(inputPath)) {
      return NextResponse.json({ error: "Valid inputPath is required" }, { status: 400 });
    }

    if (!CutoutService.isAvailable()) {
      return NextResponse.json({
        available: false,
        message: "Person cutout model or segmentation dependencies not found.",
      });
    }

    const baseDir = process.env.VERCEL ? "/tmp" : process.cwd();
    const tempDir = ensureDir(path.resolve(baseDir, "tmp", "previews"));
    const previewFileName = `cutout-preview-${crypto.randomUUID().slice(0, 8)}.png`;
    const previewPath = path.join(tempDir, previewFileName);

    await CutoutService.generateCutoutPreview(inputPath, previewPath);

    return NextResponse.json({
      success: true,
      available: true,
      previewUrl: `/api/media/stream?path=${encodeURIComponent(previewPath)}`,
      previewPath,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, available: false }, { status: 500 });
  }
}
