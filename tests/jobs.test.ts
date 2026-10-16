import { describe, it, expect, beforeEach } from "vitest";
import { JobsService } from "../src/services/jobs.service.js";
import { KalaloError } from "../src/utils/errors.js";

describe("JobsService State Machine", () => {
  beforeEach(() => {
    JobsService.clear();
  });

  it("creates a job with initial queued state, progress 0, and timestamps", () => {
    const job = JobsService.createJob("transcription");
    expect(job.status).toBe("queued");
    expect(job.progress).toBe(0);
    expect(job.stage).toBe("queued");
    expect(job.createdAt).toBeDefined();
    expect(job.updatedAt).toBeDefined();
  });

  it("transitions queued -> running successfully", () => {
    const job = JobsService.createJob("rendering");
    JobsService.startJob(job.id, "rendering");

    const running = JobsService.getJob(job.id);
    expect(running.status).toBe("running");
    expect(running.startedAt).toBeDefined();
  });

  it("rejects starting a non-queued job", () => {
    const job = JobsService.createJob("transcription");
    JobsService.startJob(job.id);

    expect(() => JobsService.startJob(job.id)).toThrow(KalaloError);
  });

  it("updates progress monotonically and keeps it bounded [0, 99.9] until completed", () => {
    const job = JobsService.createJob("rendering");
    JobsService.startJob(job.id);

    JobsService.updateProgress(job.id, 25, "extracting_audio");
    let current = JobsService.getJob(job.id);
    expect(current.progress).toBe(25);
    expect(current.stage).toBe("extracting_audio");

    // Attempt retrograde progress
    JobsService.updateProgress(job.id, 10, "retrograde");
    current = JobsService.getJob(job.id);
    expect(current.progress).toBe(25); // monotonic check

    // Higher progress
    JobsService.updateProgress(job.id, 75);
    current = JobsService.getJob(job.id);
    expect(current.progress).toBe(75);

    // Over 100 clamped to 99.9 before completion
    JobsService.updateProgress(job.id, 120);
    current = JobsService.getJob(job.id);
    expect(current.progress).toBe(99.9);
  });

  it("completes a job reaching 100% progress and saving result", () => {
    const job = JobsService.createJob<{ file: string }>("rendering");
    JobsService.startJob(job.id);

    const completed = JobsService.completeJob(job.id, { file: "output.mp4" }, "render_finished");
    expect(completed.status).toBe("completed");
    expect(completed.progress).toBe(100);
    expect(completed.stage).toBe("render_finished");
    expect(completed.finishedAt).toBeDefined();
    expect(completed.result).toEqual({ file: "output.mp4" });
  });

  it("terminal states remain terminal and cannot transition", () => {
    const job = JobsService.createJob("transcription");
    JobsService.startJob(job.id);
    JobsService.completeJob(job.id, { done: true });

    // Trying to complete again
    expect(() => JobsService.completeJob(job.id, {})).toThrow(KalaloError);
    // Trying to cancel completed job
    expect(() => JobsService.cancelJob(job.id)).toThrow("already in terminal state");
  });

  it("fails a job retaining structured error information", () => {
    const job = JobsService.createJob("rendering");
    JobsService.startJob(job.id);

    const error = new KalaloError({
      code: "RENDER_FAILED",
      message: "FFmpeg process crashed",
      retryable: false,
      details: { exitCode: 1 },
    });

    const failed = JobsService.failJob(job.id, error);
    expect(failed.status).toBe("failed");
    expect(failed.error).toBeDefined();
    expect(failed.error?.code).toBe("RENDER_FAILED");
    expect(failed.error?.details).toEqual({ exitCode: 1 });
  });

  it("cancels an active job and aborts associated signal", () => {
    const job = JobsService.createJob("transcription");
    const signal = JobsService.getJobSignal(job.id);
    expect(signal?.aborted).toBe(false);

    JobsService.startJob(job.id);
    const result = JobsService.cancelJob(job.id);

    expect(result.cancelled).toBe(true);
    expect(signal?.aborted).toBe(true);

    const updated = JobsService.getJob(job.id);
    expect(updated.status).toBe("cancelled");
  });

  it("lists jobs with status filter and limit", () => {
    const j1 = JobsService.createJob("transcription");
    const j2 = JobsService.createJob("rendering");
    JobsService.startJob(j1.id);
    JobsService.completeJob(j1.id, {});

    const all = JobsService.listJobs();
    expect(all.length).toBe(2);

    const completedOnly = JobsService.listJobs({ status: "completed" });
    expect(completedOnly.length).toBe(1);
    expect(completedOnly[0].id).toBe(j1.id);

    const limited = JobsService.listJobs({ limit: 1 });
    expect(limited.length).toBe(1);
  });

  it("automatically marks stale jobs exceeding 15 minutes as timed out", () => {
    const job = JobsService.createJob("rendering");
    JobsService.startJob(job.id);

    // Artificially age the job updatedAt to 20 minutes ago
    const internal = (JobsService as any).jobs.get(job.id);
    internal.updatedAt = new Date(Date.now() - 20 * 60 * 1000).toISOString();

    const checked = JobsService.getJob(job.id);
    expect(checked.status).toBe("failed");
    expect(checked.stage).toBe("timed_out");
    expect(checked.error?.code).toBe("PROCESS_TIMEOUT");
  });
});

