import { spawn, ChildProcess } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import { KalaloError } from "./errors.js";
import { env } from "../config/env.js";

const require = createRequire(import.meta.url);

let bundledFfmpegPath: string | undefined;
let bundledFfprobePath: string | undefined;

try {
  const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
  bundledFfmpegPath = ffmpegInstaller?.path;
} catch {
  // Ignore if unavailable
}

try {
  const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
  bundledFfprobePath = ffprobeInstaller?.path;
} catch {
  // Ignore if unavailable
}

export function resolveFfmpegPath(): string {
  if (env.KALALO_FFMPEG_PATH && fs.existsSync(env.KALALO_FFMPEG_PATH)) {
    return env.KALALO_FFMPEG_PATH;
  }
  if (bundledFfmpegPath && fs.existsSync(bundledFfmpegPath)) {
    return bundledFfmpegPath;
  }
  return "ffmpeg";
}

export function resolveFfprobePath(): string {
  if (env.KALALO_FFPROBE_PATH && fs.existsSync(env.KALALO_FFPROBE_PATH)) {
    return env.KALALO_FFPROBE_PATH;
  }
  if (bundledFfprobePath && fs.existsSync(bundledFfprobePath)) {
    return bundledFfprobePath;
  }
  return "ffprobe";
}

export interface SafeSpawnOptions {
  cwd?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  onStderrLine?: (line: string) => void;
  onStdoutLine?: (line: string) => void;
  onSpawn?: (child: ChildProcess) => void;
}

export interface SafeSpawnResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function spawnSafe(
  command: string,
  args: string[],
  options: SafeSpawnOptions = {}
): Promise<SafeSpawnResult> {
  return new Promise<SafeSpawnResult>((resolve, reject) => {
    let stdoutBuffer = "";
    let stderrBuffer = "";
    let isTerminated = false;
    let timer: NodeJS.Timeout | undefined;

    const child = spawn(command, args, {
      cwd: options.cwd,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (options.onSpawn) {
      options.onSpawn(child);
    }

    if (options.signal) {
      if (options.signal.aborted) {
        try {
          child.kill("SIGKILL");
        } catch {}
        return reject(
          new KalaloError({
            code: "PROCESS_CANCELLED",
            message: "Process execution cancelled before spawn completed",
            retryable: true,
          })
        );
      }
      options.signal.addEventListener("abort", () => {
        isTerminated = true;
        try {
          child.kill("SIGKILL");
        } catch {}
        reject(
          new KalaloError({
            code: "PROCESS_CANCELLED",
            message: "Process execution was cancelled by user request",
            retryable: true,
          })
        );
      });
    }

    if (options.timeoutMs && options.timeoutMs > 0) {
      timer = setTimeout(() => {
        isTerminated = true;
        try {
          child.kill("SIGKILL");
        } catch {}
        reject(
          new KalaloError({
            code: "PROCESS_TIMEOUT",
            message: `Process timed out after ${options.timeoutMs}ms`,
            retryable: true,
          })
        );
      }, options.timeoutMs);
    }

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stdoutBuffer += text;
      if (options.onStdoutLine) {
        text.split(/\r?\n/).forEach((line) => {
          if (line.trim()) options.onStdoutLine!(line);
        });
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderrBuffer += text;
      if (options.onStderrLine) {
        text.split(/\r?\n/).forEach((line) => {
          if (line.trim()) options.onStderrLine!(line);
        });
      }
    });

    child.on("error", (err: Error & { code?: string }) => {
      if (timer) clearTimeout(timer);
      if (isTerminated) return;

      if (err.code === "ENOENT") {
        const isFfmpeg = command.includes("ffmpeg");
        const isFfprobe = command.includes("ffprobe");
        return reject(
          new KalaloError({
            code: isFfmpeg ? "FFMPEG_NOT_FOUND" : isFfprobe ? "FFPROBE_NOT_FOUND" : "INVALID_INPUT",
            message: `Command binary not found: ${command}`,
            retryable: false,
            details: { command, originalError: err.message },
          })
        );
      }

      reject(
        new KalaloError({
          code: "RENDER_FAILED",
          message: `Failed to spawn process ${command}: ${err.message}`,
          retryable: false,
          details: { command, originalError: err.message },
        })
      );
    });

    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (isTerminated) return;

      const exitCode = code ?? 0;
      if (exitCode !== 0) {
        return reject(
          new KalaloError({
            code: "RENDER_FAILED",
            message: `Command ${command} exited with code ${exitCode}: ${stderrBuffer.slice(-1000).trim()}`,
            retryable: false,
            details: {
              exitCode,
              stderrSnippet: stderrBuffer.slice(-1000).trim(),
            },
          })
        );
      }

      resolve({
        stdout: stdoutBuffer,
        stderr: stderrBuffer,
        exitCode,
      });
    });
  });
}
