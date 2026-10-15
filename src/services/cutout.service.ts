import path from "node:path";
import fs from "node:fs";
import { spawnSafe } from "../utils/process.js";
import { KalaloError } from "../utils/errors.js";
import { ensureDir } from "../utils/paths.js";
import { env } from "../config/env.js";

export interface CutoutOptions {
  inputPath: string;
  outputPath: string;
  trimStart?: number;
  trimEnd?: number;
  previewPath?: string;
  signal?: AbortSignal;
  onProgress?: (progress: { stage: string; progress: number }) => void;
}

export class CutoutService {
  private static modelPath = path.resolve(process.cwd(), "models", "selfie_segmenter.tflite");
  private static scriptPath = path.resolve(process.cwd(), "scripts", "process_person_cutout.py");

  /**
   * Resolves the most suitable Python executable for segmentation tasks.
   * Priority: KALALO_PYTHON_PATH -> local .venv -> system python.
   */
  public static resolvePythonPath(): string {
    if (process.env.KALALO_PYTHON_PATH && fs.existsSync(process.env.KALALO_PYTHON_PATH)) {
      return process.env.KALALO_PYTHON_PATH;
    }
    const localVenvWin = path.resolve(process.cwd(), ".venv", "Scripts", "python.exe");
    if (fs.existsSync(localVenvWin)) {
      return localVenvWin;
    }
    const localVenvUnix = path.resolve(process.cwd(), ".venv", "bin", "python");
    if (fs.existsSync(localVenvUnix)) {
      return localVenvUnix;
    }
    return "python";
  }

  /**
   * Checks if person segmentation dependencies (Python, model, script) are available.
   */
  public static isAvailable(): boolean {
    if (!fs.existsSync(this.modelPath) || !fs.existsSync(this.scriptPath)) {
      return false;
    }
    const py = this.resolvePythonPath();
    if (py !== "python") {
      return fs.existsSync(py);
    }
    return true;
  }

  /**
   * Runs person cutout segmentation on a video to create a foreground alpha mask video.
   */
  public static async generateMaskVideo(options: CutoutOptions): Promise<{ maskPath: string; previewPath?: string }> {
    if (!fs.existsSync(options.inputPath)) {
      throw new KalaloError({
        code: "FILE_NOT_FOUND",
        message: `Input video not found for cutout processing: ${options.inputPath}`,
        retryable: false,
      });
    }

    if (!this.isAvailable()) {
      throw new KalaloError({
        code: "CUTOUT_UNAVAILABLE",
        message: "Person cutout model, script, or Python environment is missing. Please ensure models/selfie_segmenter.tflite and .venv with MediaPipe are installed.",
        retryable: false,
      });
    }

    options.onProgress?.({ stage: "segmenting_person", progress: 5 });

    const args = [
      this.scriptPath,
      "--input",
      options.inputPath,
      "--output",
      options.outputPath,
      "--model",
      this.modelPath,
    ];

    if (typeof options.trimStart === "number" && options.trimStart > 0) {
      args.push("--trim-start", options.trimStart.toString());
    }
    if (typeof options.trimEnd === "number" && options.trimEnd > 0) {
      args.push("--trim-end", options.trimEnd.toString());
    }
    if (options.previewPath) {
      args.push("--preview-frame", options.previewPath);
    }

    const pythonBin = this.resolvePythonPath();
    const result = await spawnSafe(pythonBin, args, {
      signal: options.signal,
      timeoutMs: 300_000, // 5 minutes max
      onStdoutLine: (line) => {
        if (line.startsWith("PROGRESS:")) {
          const pct = parseInt(line.replace("PROGRESS:", "").trim(), 10);
          if (!isNaN(pct)) {
            // Map segmentation to 10% - 90% range of the cutout stage
            const mappedProgress = Math.min(95, Math.max(10, pct));
            options.onProgress?.({ stage: "segmenting_person", progress: mappedProgress });
          }
        }
      },
    });

    if (result.exitCode !== 0) {
      throw new KalaloError({
        code: "CUTOUT_FAILED",
        message: `Person cutout segmentation failed (exit code ${result.exitCode}): ${result.stderr.slice(-300)}`,
        retryable: false,
      });
    }

    options.onProgress?.({ stage: "cutout_complete", progress: 100 });

    return {
      maskPath: options.outputPath,
      previewPath: options.previewPath && fs.existsSync(options.previewPath) ? options.previewPath : undefined,
    };
  }

  /**
   * Generates a quick transparent cutout preview PNG from a video for UI display.
   */
  public static async generateCutoutPreview(inputPath: string, outputPath: string): Promise<string> {
    const tempDir = ensureDir(env.tempDir);
    const tempMask = path.join(tempDir, `preview-mask-${Date.now()}.mp4`);

    await this.generateMaskVideo({
      inputPath,
      outputPath: tempMask,
      trimStart: 0,
      trimEnd: 1.0, // Only 1 second needed for a single frame preview
      previewPath: outputPath,
    });

    // Clean up temporary short mask
    try {
      if (fs.existsSync(tempMask)) {
        fs.unlinkSync(tempMask);
      }
    } catch {
      // ignore
    }

    return outputPath;
  }
}
