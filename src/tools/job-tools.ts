import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jobStatusSchema } from "../schemas/job.schema.js";
import { JobsService } from "../services/jobs.service.js";
import { KalaloError } from "../utils/errors.js";

export function registerJobTools(server: McpServer): void {
  // 1. kalalo_get_job_status
  server.tool(
    "kalalo_get_job_status",
    "Inspect the actual state, stage, progress (0-100%), error, and result of an existing job.",
    {
      jobId: z.string().describe("Identifier of the job to inspect"),
    },
    async ({ jobId }) => {
      try {
        const job = JobsService.getJob(jobId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(job, null, 2),
            },
          ],
        };
      } catch (err) {
        const kalaloErr =
          err instanceof KalaloError
            ? err
            : new KalaloError({
                code: "JOB_NOT_FOUND",
                message: err instanceof Error ? err.message : String(err),
                retryable: false,
              });

        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify(kalaloErr.toJSON(), null, 2),
            },
          ],
        };
      }
    }
  );

  // 2. kalalo_list_jobs
  server.tool(
    "kalalo_list_jobs",
    "List all background transcription and rendering jobs known to the running server, with optional status and count filtering.",
    {
      status: jobStatusSchema.optional().describe("Filter jobs by status ('queued', 'running', 'completed', 'failed', 'cancelled')"),
      limit: z.number().int().positive().max(100).optional().describe("Maximum number of jobs to return"),
    },
    async ({ status, limit }) => {
      const jobs = JobsService.listJobs({ status, limit });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ jobs }, null, 2),
          },
        ],
      };
    }
  );

  // 3. kalalo_cancel_job
  server.tool(
    "kalalo_cancel_job",
    "Request cancellation of an active processing job. Propagates cancellation signals to child processes and halts execution.",
    {
      jobId: z.string().describe("Identifier of the job to cancel"),
    },
    async ({ jobId }) => {
      try {
        const result = JobsService.cancelJob(jobId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        const kalaloErr =
          err instanceof KalaloError
            ? err
            : new KalaloError({
                code: "JOB_NOT_CANCELLABLE",
                message: err instanceof Error ? err.message : String(err),
                retryable: false,
              });

        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify(kalaloErr.toJSON(), null, 2),
            },
          ],
        };
      }
    }
  );
}
