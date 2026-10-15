import { describe, it, expect, beforeAll } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { createKalaloServer } from "../src/server.js";
import { spawnSafe, resolveFfmpegPath } from "../src/utils/process.js";
import { ensureDir } from "../src/utils/paths.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const FIXTURES_DIR = path.resolve(process.cwd(), "tmp", "test-fixtures");
const TEST_MEDIA_PATH = path.join(FIXTURES_DIR, "mcp-test-sample.mp4");

// Helper to invoke registered McpServer tools
async function callTool(server: McpServer, toolName: string, args: Record<string, unknown> = {}) {
  // @ts-expect-error accessing registered tools map for testing
  const registered = server._registeredTools[toolName];
  if (!registered) {
    throw new Error(`Tool "${toolName}" is not registered on McpServer`);
  }
  return await registered.handler(args, undefined);
}

describe("MCP Tools End-to-End Suite", () => {
  let server: McpServer;

  beforeAll(async () => {
    ensureDir(FIXTURES_DIR);
    const ffmpegPath = resolveFfmpegPath();

    if (!fs.existsSync(TEST_MEDIA_PATH)) {
      await spawnSafe(
        ffmpegPath,
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          "testsrc=duration=1.5:size=320x240:rate=25",
          "-f",
          "lavfi",
          "-i",
          "sine=frequency=1000:duration=1.5",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          TEST_MEDIA_PATH,
        ],
        { timeoutMs: 15000 }
      );
    }

    server = createKalaloServer();
  });

  it("registers all 9 canonical MCP tools", () => {
    // @ts-expect-error accessing registered tools map
    const toolNames = Object.keys(server._registeredTools);

    const expectedTools = [
      "kalalo_inspect_media",
      "kalalo_transcribe_media",
      "kalalo_validate_segments",
      "kalalo_list_presets",
      "kalalo_render_captions",
      "kalalo_export_subtitles",
      "kalalo_get_job_status",
      "kalalo_list_jobs",
      "kalalo_cancel_job",
    ];

    for (const name of expectedTools) {
      expect(toolNames).toContain(name);
    }
  });

  it("kalalo_list_presets: lists presets and supports aspect ratio filtering", async () => {
    const res = await callTool(server, "kalalo_list_presets", {});
    expect(res.isError).toBeFalsy();
    const data = JSON.parse(res.content[0].text);
    expect(data.presets).toBeDefined();
    expect(data.presets.length).toBeGreaterThanOrEqual(6);

    const filtered = await callTool(server, "kalalo_list_presets", { format: "9:16" });
    const filteredData = JSON.parse(filtered.content[0].text);
    expect(filteredData.presets.length).toBeGreaterThanOrEqual(6);
  });

  it("kalalo_validate_segments: accepts valid segments and rejects invalid ones", async () => {
    // Valid case
    const validRes = await callTool(server, "kalalo_validate_segments", {
      segments: [
        { id: "1", start: 0, end: 1.5, text: "नमस्ते" },
        { id: "2", start: 1.6, end: 3.0, text: "Kalalo test" },
      ],
      durationSeconds: 5.0,
    });
    const validData = JSON.parse(validRes.content[0].text);
    expect(validData.valid).toBe(true);
    expect(validData.segments.length).toBe(2);

    // Invalid overlapping case
    const invalidRes = await callTool(server, "kalalo_validate_segments", {
      segments: [
        { id: "1", start: 1, end: 3, text: "First" },
        { id: "2", start: 2, end: 4, text: "Overlap" },
      ],
    });
    const invalidData = JSON.parse(invalidRes.content[0].text);
    expect(invalidData.valid).toBe(false);
    expect(invalidData.errors).toBeDefined();
    expect(invalidData.errors.length).toBeGreaterThan(0);
  });

  it("kalalo_export_subtitles: exports SRT and WebVTT formats", async () => {
    const segments = [
      { id: "1", start: 0.5, end: 1.5, text: "Namaste" },
      { id: "2", start: 1.6, end: 2.5, text: "Welcome to Kalalo" },
    ];

    const srtRes = await callTool(server, "kalalo_export_subtitles", {
      segments,
      format: "srt",
    });
    const srtData = JSON.parse(srtRes.content[0].text);
    expect(srtData.format).toBe("srt");
    expect(srtData.content).toContain("00:00:00,500 --> 00:00:01,500");

    const vttRes = await callTool(server, "kalalo_export_subtitles", {
      segments,
      format: "vtt",
    });
    const vttData = JSON.parse(vttRes.content[0].text);
    expect(vttData.format).toBe("vtt");
    expect(vttData.content).toContain("00:00:00.500 --> 00:00:01.500");
  });

  it("kalalo_transcribe_media & kalalo_get_job_status: transcribes media and verifies job state", async () => {
    const res = await callTool(server, "kalalo_transcribe_media", {
      inputPath: TEST_MEDIA_PATH,
      language: "hinglish",
      provider: "mock",
    });

    expect(res.isError).toBeFalsy();
    const data = JSON.parse(res.content[0].text);
    expect(data.jobId).toBeDefined();
    expect(data.status).toBe("completed");
    expect(data.segments.length).toBeGreaterThan(0);

    // Check job status through kalalo_get_job_status
    const statusRes = await callTool(server, "kalalo_get_job_status", {
      jobId: data.jobId,
    });
    const statusData = JSON.parse(statusRes.content[0].text);
    expect(statusData.id).toBe(data.jobId);
    expect(statusData.status).toBe("completed");
    expect(statusData.progress).toBe(100);
  });

  it("kalalo_inspect_media: inspects real media and returns streams", async () => {
    const res = await callTool(server, "kalalo_inspect_media", {
      inputPath: TEST_MEDIA_PATH,
    });
    expect(res.isError).toBeFalsy();
    const data = JSON.parse(res.content[0].text);
    expect(data.hasVideo).toBe(true);
    expect(data.hasAudio).toBe(true);
    expect(data.durationSeconds).toBeGreaterThan(1.0);
    expect(data.video.codec).toContain("h264");
  });

  it("kalalo_list_jobs: returns known jobs", async () => {
    const res = await callTool(server, "kalalo_list_jobs", {});
    expect(res.isError).toBeFalsy();
    const data = JSON.parse(res.content[0].text);
    expect(Array.isArray(data.jobs)).toBe(true);
    expect(data.jobs.length).toBeGreaterThan(0);
  });

  it("kalalo_cancel_job: handles job cancellation", async () => {
    // Attempting to cancel non-existent job
    const nonExistentRes = await callTool(server, "kalalo_cancel_job", {
      jobId: "non-existent-id",
    });
    expect(nonExistentRes.isError).toBe(true);
    const errData = JSON.parse(nonExistentRes.content[0].text);
    expect(errData.code).toBe("JOB_NOT_FOUND");
  });

  it("handles errors gracefully and returns machine-readable error payload", async () => {
    const badInspect = await callTool(server, "kalalo_inspect_media", {
      inputPath: "non-existent-file.mp4",
    });
    expect(badInspect.isError).toBe(true);
    const err = JSON.parse(badInspect.content[0].text);
    expect(err.code).toBe("MEDIA_NOT_FOUND");
    expect(err.retryable).toBe(false);
  });
});
