import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import crypto from "node:crypto";
import { RenderingService, RenderResult } from "@/src/services/rendering.service";
import { JobsService } from "@/src/services/jobs.service";
import { ensureDir } from "@/src/utils/paths";
import { env } from "@/src/config/env";
import { AspectRatio } from "@/src/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      inputPath,
      mediaPath,
      segments,
      presetId = "kalalo-clean-bold",
      aspectRatio = "9:16",
      customPreset,
      trimStart,
      trimEnd,
      muteAudio,
      resolution,
      personCutout,
    } = body;

    const sourceVideoPath = inputPath || mediaPath;

    if (!sourceVideoPath || !segments) {
      return NextResponse.json(
        { error: "inputPath and segments are required" },
        { status: 400 }
      );
    }

    const outDir = ensureDir(env.outputDir);
    const outputPath = path.join(
      outDir,
      `render-${aspectRatio.replace(":", "-")}-${crypto.randomUUID()}.mp4`
    );

    const job = JobsService.createJob<RenderResult>("rendering");
    JobsService.startJob(job.id, "rendering");
    const signal = JobsService.getJobSignal(job.id);

    const isAsync = body.async === true;

    if (isAsync) {
      // Execute in background without blocking HTTP connection
      (async () => {
        try {
          const renderResult = await RenderingService.renderCaptions({
            inputPath: sourceVideoPath,
            outputPath,
            segments,
            presetId,
            customPreset,
            aspectRatio: aspectRatio as AspectRatio,
            trimStart,
            trimEnd,
            muteAudio,
            resolution,
            personCutout: Boolean(personCutout),
            signal,
            onProgress: (p) => {
              JobsService.updateProgress(job.id, p.progress, p.stage);
            },
          });

          JobsService.completeJob(job.id, {
            ...renderResult,
            streamUrl: `/api/media/stream?path=${encodeURIComponent(renderResult.outputPath)}`,
            downloadUrl: `/api/media/stream?path=${encodeURIComponent(renderResult.outputPath)}&download=true&filename=kalalo-captioned-${aspectRatio.replace(":", "-")}.mp4`,
          }, "render_completed");
        } catch (err: unknown) {
          const details = (err as any)?.details;
          JobsService.failJob(job.id, {
            code: "RENDER_FAILED",
            message: err instanceof Error ? err.message : String(err),
            details,
            retryable: false,
          });
        }
      })();

      return NextResponse.json({
        jobId: job.id,
        status: "running",
        message: "Rendering started in background",
      });
    }

    const renderResult = await RenderingService.renderCaptions({
      inputPath: sourceVideoPath,
      outputPath,
      segments,
      presetId,
      customPreset,
      aspectRatio: aspectRatio as AspectRatio,
      trimStart,
      trimEnd,
      muteAudio,
      resolution,
      personCutout: Boolean(personCutout),
      signal,
      onProgress: (p) => {
        JobsService.updateProgress(job.id, p.progress, p.stage);
      },
    });

    const resultWithUrls = {
      ...renderResult,
      streamUrl: `/api/media/stream?path=${encodeURIComponent(renderResult.outputPath)}`,
      downloadUrl: `/api/media/stream?path=${encodeURIComponent(renderResult.outputPath)}&download=true&filename=kalalo-captioned-${aspectRatio.replace(":", "-")}.mp4`,
    };

    const completed = JobsService.completeJob(job.id, resultWithUrls, "render_completed");

    return NextResponse.json({
      jobId: completed.id,
      status: completed.status,
      outputPath: renderResult.outputPath,
      streamUrl: resultWithUrls.streamUrl,
      downloadUrl: resultWithUrls.downloadUrl,
      result: resultWithUrls,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const details = (err as any)?.details;
    return NextResponse.json({ error: message, details }, { status: 500 });
  }
}
