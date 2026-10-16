import { describe, it, expect } from "vitest";
import { SubtitleExportService } from "../src/services/subtitle-export.service.js";
import { JobsService } from "../src/services/jobs.service.js";
import { ProjectsService } from "../src/services/projects.service.js";
import { validateInputPath, validateMediaServingPath } from "../src/utils/paths.js";
import { sanitizeLogData, Logger } from "../src/utils/logger.js";
import { KalaloError } from "../src/utils/errors.js";
import { CaptionSegment } from "../src/types/index.js";

describe("Production Reliability & Security Test Suite", () => {
  describe("1. Security: Path Traversal & Media Validation", () => {
    it("rejects path traversal attempts in media serving paths", () => {
      expect(() => validateMediaServingPath("../../../etc/passwd")).toThrow(KalaloError);
      expect(() => validateMediaServingPath("..\\..\\Windows\\System32\\cmd.exe")).toThrow();
    });

    it("rejects unsupported media extensions", () => {
      expect(() => validateMediaServingPath("malicious.exe")).toThrow(KalaloError);
      expect(() => validateMediaServingPath("script.sh")).toThrow(KalaloError);
      expect(() => validateMediaServingPath("payload.php")).toThrow(KalaloError);
    });

    it("rejects null-byte injections", () => {
      expect(() => validateInputPath("video.mp4\0.txt")).toThrow(KalaloError);
    });
  });

  describe("2. Security: Sensitive Data Redaction in Logging", () => {
    it("redacts passwords, tokens, and secret keys from log metadata", () => {
      const sensitiveObj = {
        userId: "usr_123",
        password: "MySecretPassword123!",
        userToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.abc",
        apiKey: "AIzaSySecretApiKey12345",
        mediaUrl: "https://supabase.co/storage/v1/object/sign/bucket/vid.mp4?token=secretTokenValue123",
      };

      const sanitized = sanitizeLogData(sensitiveObj) as Record<string, string>;
      expect(sanitized.userId).toBe("usr_123");
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.userToken).toBe("[REDACTED]");
      expect(sanitized.apiKey).toBe("[REDACTED]");
      expect(sanitized.mediaUrl).toContain("token=[REDACTED]");
      expect(sanitized.mediaUrl).not.toContain("secretTokenValue123");
    });

    it("translates internal system paths safely for client responses", () => {
      const enoentErr = new Error("ENOENT: no such file or directory, open 'C:\\Windows\\system32\\file.mp4'");
      const safe = Logger.toSafeClientError(enoentErr);
      expect(safe.error).toBe("Requested resource or media file could not be found.");
      expect(safe.code).toBe("NOT_FOUND");
    });
  });

  describe("3. Project Save & Multi-track Persistence", () => {
    it("creates, persists, and normalizes caption segments for a project", () => {
      const segments: CaptionSegment[] = [
        { id: "s1", start: 0.05, end: 1.8, text: "Testing reliability.", language: "en" },
        { id: "s2", start: 2.1, end: 4.5, text: "Second segment.", language: "en" },
      ];

      const proj = ProjectsService.createProject({
        name: "Reliability Test Project",
        fileName: "clip.mp4",
        filePath: "samples/sample-video.mp4",
        durationSeconds: 5.0,
        aspectRatio: "9:16",
        presetId: "kalalo-clean-bold",
        segments,
      });

      expect(proj.id).toBeDefined();
      expect(proj.segments.length).toBe(2);
      expect(proj.segments[0].text).toBe("Testing reliability.");

      // Update project with new caption and rename
      const updated = ProjectsService.updateProject(proj.id, {
        name: "Renamed Reliability Project",
        segments: [
          { id: "s1", start: 0.1, end: 2.0, text: "Updated first caption.", language: "en" },
        ],
      });

      expect(updated?.name).toBe("Renamed Reliability Project");
      expect(updated?.segments.length).toBe(1);
      expect(updated?.segments[0].text).toBe("Updated first caption.");

      // Read back
      const read = ProjectsService.getProject(proj.id);
      expect(read?.name).toBe("Renamed Reliability Project");
      expect(read?.segments.length).toBe(1);
    });
  });

  describe("4. Subtitle Export Correctness", () => {
    const testSegments: CaptionSegment[] = [
      { id: "1", start: 1.25, end: 3.5, text: "First subtitle line", language: "en" },
      { id: "2", start: 4.0, end: 6.85, text: "Second subtitle line with Hindi/Devanagari: नमस्ते", language: "hi" },
    ];

    it("generates compliant SRT formatting with correct timestamps and Unicode text", () => {
      const srt = SubtitleExportService.serializeSrt(testSegments);
      expect(srt).toContain("1\n00:00:01,250 --> 00:00:03,500\nFirst subtitle line");
      expect(srt).toContain("2\n00:00:04,000 --> 00:00:06,850\nSecond subtitle line with Hindi/Devanagari: नमस्ते");
    });

    it("generates compliant WebVTT formatting with WEBVTT header and period-separated milliseconds", () => {
      const vtt = SubtitleExportService.serializeVtt(testSegments);
      expect(vtt.startsWith("WEBVTT")).toBe(true);
      expect(vtt).toContain("00:00:01.250 --> 00:00:03.500\nFirst subtitle line");
      expect(vtt).toContain("00:00:04.000 --> 00:00:06.850\nSecond subtitle line with Hindi/Devanagari: नमस्ते");
    });
  });

  describe("5. Job State Machine & Auto-Timeout Resilience", () => {
    it("enforces valid lifecycle and rejects invalid retrograde transitions", () => {
      const job = JobsService.createJob("transcription");
      expect(job.status).toBe("queued");

      JobsService.startJob(job.id);
      expect(JobsService.getJob(job.id).status).toBe("running");

      // Cannot start already running job
      expect(() => JobsService.startJob(job.id)).toThrow(KalaloError);

      JobsService.completeJob(job.id, { result: "done" });
      expect(JobsService.getJob(job.id).status).toBe("completed");

      // Cannot complete already completed job
      expect(() => JobsService.completeJob(job.id, {})).toThrow(KalaloError);
    });
  });
});
