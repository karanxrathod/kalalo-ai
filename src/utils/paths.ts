import fs from "node:fs";
import path from "node:path";
import { KalaloError } from "./errors.js";

const SENSITIVE_PATTERNS = [
  /\.env($|\.)/i,
  /\.git([\\/]|$)/i,
  /\.ssh([\\/]|$)/i,
  /id_rsa/i,
  /id_ed25519/i,
  /etc[\\/]passwd/i,
  /etc[\\/]shadow/i,
  /windows[\\/]system32/i,
  /kalalo-store\.json/i,
];

const ALLOWED_MEDIA_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".webm",
  ".mkv",
  ".avi",
  ".m4v",
  ".mp3",
  ".wav",
  ".m4a",
  ".aac",
  ".flac",
  ".ogg",
  ".srt",
  ".vtt",
  ".ass",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
]);

/**
 * Validates and resolves an input file path. Ensures it exists, is a file, and does not perform illicit traversal.
 */
export function validateInputPath(filePath: string): string {
  if (!filePath || typeof filePath !== "string" || filePath.trim().length === 0) {
    throw new KalaloError({
      code: "INVALID_INPUT",
      message: "Input path must be a non-empty string",
      retryable: false,
    });
  }

  // Reject null-bytes
  if (filePath.includes("\0")) {
    throw new KalaloError({
      code: "INVALID_INPUT",
      message: "Path traversal or null-byte detected in path",
      retryable: false,
    });
  }

  const resolved = path.resolve(filePath.trim());

  // Block sensitive files
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(resolved)) {
      throw new KalaloError({
        code: "INVALID_INPUT",
        message: "Access to protected system or configuration file is strictly denied",
        retryable: false,
        details: { path: resolved },
      });
    }
  }

  if (!fs.existsSync(resolved)) {
    throw new KalaloError({
      code: "MEDIA_NOT_FOUND",
      message: `Media file does not exist at path: ${resolved}`,
      retryable: false,
      details: { path: resolved },
    });
  }

  const stats = fs.statSync(resolved);
  if (!stats.isFile()) {
    throw new KalaloError({
      code: "UNSUPPORTED_MEDIA",
      message: `Path is not a regular file: ${resolved}`,
      retryable: false,
      details: { path: resolved },
    });
  }

  return resolved;
}

/**
 * Validates a media path intended for streaming or downloading through the web API.
 * Ensures strict extension allowlist, prevents traversal, and denies access to private files.
 */
export function validateMediaServingPath(filePath: string): string {
  const resolved = validateInputPath(filePath);
  const ext = path.extname(resolved).toLowerCase();

  if (!ALLOWED_MEDIA_EXTENSIONS.has(ext)) {
    throw new KalaloError({
      code: "UNSUPPORTED_MEDIA",
      message: `File type '${ext}' is not permitted for media streaming or downloading`,
      retryable: false,
      details: { path: resolved, extension: ext },
    });
  }

  return resolved;
}

/**
 * Validates and ensures the parent directory of an output path exists.
 */
export function validateOutputPath(filePath: string, disallowOverwriteTarget?: string): string {
  if (!filePath || typeof filePath !== "string" || filePath.trim().length === 0) {
    throw new KalaloError({
      code: "INVALID_INPUT",
      message: "Output path must be a non-empty string",
      retryable: false,
    });
  }

  // Reject null-bytes
  if (filePath.includes("\0")) {
    throw new KalaloError({
      code: "INVALID_INPUT",
      message: "Null-byte detected in output path",
      retryable: false,
    });
  }

  const resolved = path.resolve(filePath.trim());

  // Block sensitive files as output targets
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(resolved)) {
      throw new KalaloError({
        code: "INVALID_INPUT",
        message: "Writing to protected system or configuration file is strictly denied",
        retryable: false,
        details: { path: resolved },
      });
    }
  }

  if (disallowOverwriteTarget) {
    const resolvedTarget = path.resolve(disallowOverwriteTarget.trim());
    if (resolved.toLowerCase() === resolvedTarget.toLowerCase()) {
      throw new KalaloError({
        code: "INVALID_INPUT",
        message: "Output path cannot be the same as input path to prevent accidental file corruption",
        retryable: false,
        details: { inputPath: resolvedTarget, outputPath: resolved },
      });
    }
  }

  const parentDir = path.dirname(resolved);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  return resolved;
}

/**
 * Ensures a directory exists.
 */
export function ensureDir(dirPath: string): string {
  if (!dirPath || typeof dirPath !== "string" || dirPath.trim().length === 0 || dirPath.includes("\0")) {
    throw new KalaloError({
      code: "INVALID_INPUT",
      message: "Directory path must be a non-empty string without null-bytes",
      retryable: false,
    });
  }

  const resolved = path.resolve(dirPath);
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }
  return resolved;
}

