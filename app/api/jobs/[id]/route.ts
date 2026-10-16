import { NextRequest, NextResponse } from "next/server";
import { JobsService } from "@/src/services/jobs.service";
import { SupabaseService } from "@/src/services/supabase.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    try {
      const job = JobsService.getJob(params.id);
      return NextResponse.json(job);
    } catch (memErr) {
      if (SupabaseService.isEnabled()) {
        const supaJob = await SupabaseService.getJob(params.id);
        if (supaJob) {
          return NextResponse.json({
            id: supaJob.id,
            type: supaJob.type,
            status: supaJob.status,
            progress: supaJob.progress,
            stage: supaJob.stage,
            result: supaJob.result,
            error: supaJob.error,
            createdAt: supaJob.created_at,
            startedAt: supaJob.started_at,
            finishedAt: supaJob.completed_at,
          });
        }
      }
      throw memErr;
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 404 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Cancellation request endpoint
  try {
    const result = JobsService.cancelJob(params.id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}

