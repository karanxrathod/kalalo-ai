import { NextRequest, NextResponse } from "next/server";
import { JobsService } from "@/src/services/jobs.service";
import { JobStatus } from "@/src/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as JobStatus | undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const jobs = JobsService.listJobs({ status, limit });
    return NextResponse.json({ jobs });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
