import { NextRequest, NextResponse } from "next/server";
import { JobsService } from "@/src/services/jobs.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = JobsService.getJob(params.id);
    return NextResponse.json(job);
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
