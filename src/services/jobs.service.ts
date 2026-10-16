import crypto from "node:crypto";
import { Job, JobStatus, JobType } from "../types/index.js";
import { KalaloError, KalaloErrorDetails } from "../utils/errors.js";

interface InternalJobRecord extends Job {
  abortController?: AbortController;
}

export class JobsService {
  private static jobs = new Map<string, InternalJobRecord>();

  /**
   * Creates a new job in the "queued" state.
   */
  public static createJob<T = unknown>(type: JobType, id?: string): Job<T> {
    const jobId = id || `job-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const job: InternalJobRecord = {
      id: jobId,
      type,
      status: "queued",
      progress: 0,
      stage: "queued",
      createdAt: now,
      updatedAt: now,
      abortController: new AbortController(),
    };

    this.jobs.set(jobId, job);
    return this.sanitizeJob(job);
  }

  /**
   * Retrieves an AbortSignal associated with an active job.
   */
  public static getJobSignal(jobId: string): AbortSignal | undefined {
    return this.jobs.get(jobId)?.abortController?.signal;
  }

  /**
   * Transitions a job to "running" state.
   */
  public static startJob(jobId: string, initialStage = "running"): void {
    const job = this.getInternalJob(jobId);
    if (job.status !== "queued") {
      throw new KalaloError({
        code: "INVALID_INPUT",
        message: `Cannot start job ${jobId} because it is in state "${job.status}"`,
        retryable: false,
      });
    }

    const now = new Date().toISOString();
    job.status = "running";
    job.stage = initialStage;
    job.startedAt = now;
    job.updatedAt = now;
  }

  /**
   * Updates progress monotonically while running.
   */
  public static updateProgress(jobId: string, progress: number, stage?: string): void {
    const job = this.getInternalJob(jobId);
    if (job.status !== "running" && job.status !== "cancel_requested") {
      return;
    }

    const bounded = Math.max(0, Math.min(99.9, progress));
    // Keep progress monotonic
    if (bounded >= job.progress) {
      job.progress = bounded;
    }
    if (stage) {
      job.stage = stage;
    }
    job.updatedAt = new Date().toISOString();
  }

  /**
   * Completes a running job.
   */
  public static completeJob<T = unknown>(jobId: string, result: T, message?: string): Job<T> {
    const job = this.getInternalJob(jobId);
    if (job.status !== "running" && job.status !== "cancel_requested") {
      throw new KalaloError({
        code: "INVALID_INPUT",
        message: `Cannot complete job ${jobId} from status "${job.status}"`,
        retryable: false,
      });
    }

    const now = new Date().toISOString();
    job.status = "completed";
    job.progress = 100;
    job.stage = message || "completed";
    job.finishedAt = now;
    job.updatedAt = now;
    job.result = result;

    return this.sanitizeJob(job);
  }

  /**
   * Fails a running or queued job.
   */
  public static failJob(jobId: string, error: KalaloErrorDetails | Error): Job {
    const job = this.getInternalJob(jobId);
    if (this.isTerminal(job.status)) {
      return this.sanitizeJob(job);
    }

    const now = new Date().toISOString();
    job.status = "failed";
    job.stage = "failed";
    job.finishedAt = now;
    job.updatedAt = now;

    if (error instanceof KalaloError) {
      job.error = error.toJSON();
    } else {
      job.error = {
        code: (error as { code?: string }).code || "RENDER_FAILED",
        message: error.message || String(error),
        retryable: false,
      };
    }

    return this.sanitizeJob(job);
  }

  /**
   * Requests cancellation of an active job.
   */
  public static cancelJob(jobId: string): { jobId: string; status: JobStatus; cancelled: boolean; message: string } {
    const job = this.getInternalJob(jobId);

    if (this.isTerminal(job.status)) {
      throw new KalaloError({
        code: "JOB_NOT_CANCELLABLE",
        message: `Job ${jobId} cannot be cancelled because it is already in terminal state "${job.status}"`,
        retryable: false,
        details: { jobId, status: job.status },
      });
    }

    // Trigger abort signal
    if (job.abortController && !job.abortController.signal.aborted) {
      job.abortController.abort();
    }

    const now = new Date().toISOString();
    if (job.status === "queued") {
      job.status = "cancelled";
      job.stage = "cancelled";
      job.finishedAt = now;
      job.updatedAt = now;
      return {
        jobId,
        status: "cancelled",
        cancelled: true,
        message: "Queued job was cancelled immediately",
      };
    }

    // For running jobs, transition to cancelled
    job.status = "cancelled";
    job.stage = "cancelled";
    job.finishedAt = now;
    job.updatedAt = now;

    return {
      jobId,
      status: "cancelled",
      cancelled: true,
      message: "Job cancellation succeeded",
    };
  }

  /**
   * Retrieves a job by ID.
   */
  public static getJob<T = unknown>(jobId: string): Job<T> {
    const job = this.getInternalJob(jobId);
    return this.sanitizeJob(job);
  }

  /**
   * Lists jobs with optional filtering.
   */
  public static listJobs(filter?: { status?: JobStatus; limit?: number }): Job[] {
    let all = Array.from(this.jobs.values()).map((j) => {
      this.checkJobTimeout(j);
      return this.sanitizeJob(j);
    });

    if (filter?.status) {
      all = all.filter((j) => j.status === filter.status);
    }

    // Sort newest first
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filter?.limit && filter.limit > 0) {
      all = all.slice(0, filter.limit);
    }

    return all;
  }

  private static checkJobTimeout(job: InternalJobRecord): void {
    if (!this.isTerminal(job.status)) {
      const ageMs = Date.now() - new Date(job.updatedAt).getTime();
      const MAX_JOB_AGE_MS = 15 * 60 * 1000;
      if (ageMs > MAX_JOB_AGE_MS) {
        job.status = "failed";
        job.stage = "timed_out";
        job.error = {
          code: "PROCESS_TIMEOUT",
          message: "Operation exceeded maximum processing timeout",
          retryable: true,
        };
        job.finishedAt = new Date().toISOString();
        job.updatedAt = job.finishedAt;
      }
    }
  }

  private static getInternalJob(jobId: string): InternalJobRecord {
    if (!jobId || typeof jobId !== "string") {
      throw new KalaloError({
        code: "INVALID_INPUT",
        message: "Job ID must be a non-empty string",
        retryable: false,
      });
    }

    const job = this.jobs.get(jobId);
    if (!job) {
      throw new KalaloError({
        code: "JOB_NOT_FOUND",
        message: `No job found with ID: ${jobId}`,
        retryable: false,
        details: { jobId },
      });
    }

    this.checkJobTimeout(job);
    return job;
  }

  private static isTerminal(status: JobStatus): boolean {
    return status === "completed" || status === "failed" || status === "cancelled";
  }

  private static sanitizeJob<T>(record: InternalJobRecord): Job<T> {
    const { abortController: _, ...clean } = record;
    return clean as Job<T>;
  }

  /**
   * Clear jobs (for testing)
   */
  public static clear(): void {
    this.jobs.clear();
  }
}
