import { NextRequest, NextResponse } from "next/server";
import { ProviderFactory } from "@/src/services/transcription/provider.factory";
import { JobsService } from "@/src/services/jobs.service";
import { CaptionSegment, TranscriptionLanguage } from "@/src/types";
import { KalaloError } from "@/src/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inputPath, language = "auto", provider } = body;

    if (!inputPath) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "inputPath is required" } },
        { status: 400 }
      );
    }

    const job = JobsService.createJob<{ segments: CaptionSegment[]; detectedLanguage?: string }>(
      "transcription"
    );

    JobsService.startJob(job.id, "transcribing");
    const signal = JobsService.getJobSignal(job.id);
    const sttProvider = ProviderFactory.getProvider(provider);

    const headerApiKey = request.headers.get("x-gemini-api-key") || request.headers.get("x-api-key");
    const apiKey = body.apiKey || headerApiKey || undefined;
    const model = body.model || undefined;

    const result = await sttProvider.transcribe({
      inputPath,
      language: language as TranscriptionLanguage,
      apiKey,
      model,
      signal,
      onProgress: (p: { stage?: string; progress?: number }) => {
        if (p.progress !== undefined) {
          JobsService.updateProgress(job.id, p.progress, p.stage);
        }
      },
    });

    const completed = JobsService.completeJob(job.id, {
      segments: result.segments,
      detectedLanguage: result.detectedLanguage,
    });

    return NextResponse.json({
      jobId: completed.id,
      status: completed.status,
      segments: result.segments,
      detectedLanguage: result.detectedLanguage,
      provider: result.provider,
    });
  } catch (err: unknown) {
    if (err instanceof KalaloError) {
      return NextResponse.json({ error: err.toJSON() }, { status: 400 });
    }
    return NextResponse.json(
      { error: { code: "STT_PROVIDER_ERROR", message: err instanceof Error ? err.message : String(err) } },
      { status: 500 }
    );
  }
}
