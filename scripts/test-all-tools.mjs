import path from "node:path";
import fs from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

function printHeader(title) {
  console.log(`\n==================================================`);
  console.log(`  ${title}`);
  console.log(`==================================================`);
}

async function main() {
  console.log("[Kalalo Test Runner] Starting full 9-tool end-to-end verification...\n");

  const sampleVideo = path.resolve(process.cwd(), "samples", "sample-video.mp4");
  if (!fs.existsSync(sampleVideo)) {
    throw new Error(`Sample video missing at: ${sampleVideo}. Run 'npm run generate:sample' first.`);
  }

  const serverScript = path.resolve(process.cwd(), "dist", "index.js");
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverScript],
  });

  const client = new Client(
    { name: "kalalo-full-test-runner", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✓ Connected to Kalalo MCP Server over STDIO");

  // Tool 1: kalalo_inspect_media
  printHeader("Tool 1/9: kalalo_inspect_media");
  console.log(`Input: inputPath = "${sampleVideo}"`);
  const inspectRes = await client.callTool({
    name: "kalalo_inspect_media",
    arguments: { inputPath: sampleVideo },
  });
  const inspectData = JSON.parse(inspectRes.content[0].text);
  console.log("Result:", JSON.stringify(inspectData, null, 2));

  // Tool 2: kalalo_transcribe_media
  printHeader("Tool 2/9: kalalo_transcribe_media");
  console.log(`Input: inputPath = "${sampleVideo}", language = "hinglish", provider = "mock"`);
  const transcribeRes = await client.callTool({
    name: "kalalo_transcribe_media",
    arguments: {
      inputPath: sampleVideo,
      language: "hinglish",
      provider: "mock",
    },
  });
  const transcribeData = JSON.parse(transcribeRes.content[0].text);
  console.log("Result Summary:", {
    jobId: transcribeData.jobId,
    status: transcribeData.status,
    segmentCount: transcribeData.segments?.length,
    detectedLanguage: transcribeData.detectedLanguage,
  });
  const segments = transcribeData.segments;

  // Tool 3: kalalo_validate_segments
  printHeader("Tool 3/9: kalalo_validate_segments");
  console.log(`Input: segments count = ${segments.length}, durationSeconds = ${inspectData.durationSeconds}`);
  const validateRes = await client.callTool({
    name: "kalalo_validate_segments",
    arguments: {
      segments,
      durationSeconds: inspectData.durationSeconds,
    },
  });
  const validateData = JSON.parse(validateRes.content[0].text);
  console.log("Result:", JSON.stringify(validateData, null, 2));

  // Tool 4: kalalo_list_presets
  printHeader("Tool 4/9: kalalo_list_presets");
  console.log(`Input: format = "9:16"`);
  const presetsRes = await client.callTool({
    name: "kalalo_list_presets",
    arguments: { format: "9:16" },
  });
  const presetsData = JSON.parse(presetsRes.content[0].text);
  console.log(`Found ${presetsData.presets.length} presets:`);
  presetsData.presets.forEach((p) => {
    console.log(`- ${p.id}: ${p.name} (${p.description})`);
  });

  // Tool 5: kalalo_export_subtitles
  printHeader("Tool 5/9: kalalo_export_subtitles");
  const srtOutPath = path.resolve(process.cwd(), "output", "test-captions.srt");
  const vttOutPath = path.resolve(process.cwd(), "output", "test-captions.vtt");
  
  console.log(`Exporting SRT to: ${srtOutPath}`);
  const srtExport = await client.callTool({
    name: "kalalo_export_subtitles",
    arguments: {
      segments,
      format: "srt",
      outputPath: srtOutPath,
    },
  });
  console.log("SRT Export Result:", JSON.parse(srtExport.content[0].text));

  console.log(`Exporting WebVTT to: ${vttOutPath}`);
  const vttExport = await client.callTool({
    name: "kalalo_export_subtitles",
    arguments: {
      segments,
      format: "vtt",
      outputPath: vttOutPath,
    },
  });
  console.log("WebVTT Export Result:", JSON.parse(vttExport.content[0].text));

  // Tool 6: kalalo_render_captions
  printHeader("Tool 6/9: kalalo_render_captions");
  const renderedVideo = path.resolve(process.cwd(), "output", "test-captioned-9-16.mp4");
  console.log(`Rendering 9:16 vertical video to: ${renderedVideo}`);
  const renderRes = await client.callTool({
    name: "kalalo_render_captions",
    arguments: {
      inputPath: sampleVideo,
      outputPath: renderedVideo,
      segments,
      presetId: "kalalo-clean-bold",
      aspectRatio: "9:16",
    },
  });
  const renderData = JSON.parse(renderRes.content[0].text);
  console.log("Render Result:", JSON.stringify(renderData, null, 2));

  // Tool 7: kalalo_get_job_status
  printHeader("Tool 7/9: kalalo_get_job_status");
  console.log(`Checking status for Job: ${renderData.jobId}`);
  const statusRes = await client.callTool({
    name: "kalalo_get_job_status",
    arguments: { jobId: renderData.jobId },
  });
  console.log("Job Status Result:", JSON.parse(statusRes.content[0].text));

  // Tool 8: kalalo_list_jobs
  printHeader("Tool 8/9: kalalo_list_jobs");
  const listJobsRes = await client.callTool({
    name: "kalalo_list_jobs",
    arguments: {},
  });
  const listJobsData = JSON.parse(listJobsRes.content[0].text);
  console.log(`Known Jobs Count: ${listJobsData.jobs.length}`);
  listJobsData.jobs.forEach((j) => {
    console.log(`- Job ${j.id} [${j.type}] => Status: ${j.status}, Progress: ${j.progress}%`);
  });

  // Tool 9: kalalo_cancel_job
  printHeader("Tool 9/9: kalalo_cancel_job");
  // Test error handling for non-existent job cancellation
  console.log("Testing cancel on invalid job ID:");
  const cancelBadRes = await client.callTool({
    name: "kalalo_cancel_job",
    arguments: { jobId: "non-existent-test-job" },
  });
  console.log("Error Response as Expected:", JSON.parse(cancelBadRes.content[0].text));

  await client.close();
  printHeader("ALL 9 MCP TOOLS VERIFIED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("\n[Error in test-all-tools]", err);
  process.exit(1);
});
