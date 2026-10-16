/**
 * Kalalo Production Structured Logger & Observability Utility
 * Provides sanitized, structured logging with correlation IDs and sensitive data redaction.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  correlationId?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    code?: string | number;
    stack?: string;
  };
}

const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /key/i,
  /auth/i,
  /credential/i,
  /cookie/i,
];

/**
 * Deeply sanitizes objects to remove sensitive tokens, passwords, and private URLs before logging.
 */
export function sanitizeLogData(obj: unknown, depth = 0): unknown {
  if (depth > 5) return "[MaxDepth]";
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // Redact JWT tokens
    if (/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(obj)) {
      return "[REDACTED_JWT]";
    }
    // Redact query parameter tokens in URLs
    if (obj.includes("token=") || obj.includes("key=") || obj.includes("secret=")) {
      return obj.replace(/(token|key|secret)=([^&]+)/gi, "$1=[REDACTED]");
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeLogData(item, depth + 1));
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitive) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeLogData(val, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

export class Logger {
  private static formatEntry(
    level: LogLevel,
    context: string,
    message: string,
    metadata?: Record<string, unknown>,
    err?: unknown,
    correlationId?: string
  ): LogPayload {
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      correlationId: correlationId || (metadata?.correlationId as string) || undefined,
    };

    if (metadata) {
      payload.data = sanitizeLogData(metadata) as Record<string, unknown>;
    }

    if (err) {
      if (err instanceof Error) {
        payload.error = {
          name: err.name,
          message: err.message,
          code: (err as any).code,
          ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
        };
      } else {
        payload.error = {
          name: "UnknownError",
          message: String(err),
        };
      }
    }

    return payload;
  }

  public static info(context: string, message: string, metadata?: Record<string, unknown>, correlationId?: string): void {
    const entry = this.formatEntry("info", context, message, metadata, undefined, correlationId);
    console.log(JSON.stringify(entry));
  }

  public static warn(context: string, message: string, metadata?: Record<string, unknown>, correlationId?: string): void {
    const entry = this.formatEntry("warn", context, message, metadata, undefined, correlationId);
    console.warn(JSON.stringify(entry));
  }

  public static error(
    context: string,
    message: string,
    err?: unknown,
    metadata?: Record<string, unknown>,
    correlationId?: string
  ): void {
    const entry = this.formatEntry("error", context, message, metadata, err, correlationId);
    console.error(JSON.stringify(entry));
  }

  public static debug(context: string, message: string, metadata?: Record<string, unknown>, correlationId?: string): void {
    if (process.env.NODE_ENV !== "production" || process.env.KALALO_DEBUG === "true") {
      const entry = this.formatEntry("debug", context, message, metadata, undefined, correlationId);
      console.debug(JSON.stringify(entry));
    }
  }

  /**
   * Translates internal errors into safe, actionable messages for client responses without leaking stack traces or internal paths.
   */
  public static toSafeClientError(err: unknown, defaultMessage = "An unexpected error occurred"): { error: string; code?: string } {
    if (!err) return { error: defaultMessage };

    const message = err instanceof Error ? err.message : String(err);
    const code = (err as any)?.code;

    // Filter out internal system path or driver errors
    if (message.includes("ENOENT") || message.includes("C:\\") || message.includes("/vercel/")) {
      return { error: "Requested resource or media file could not be found.", code: "NOT_FOUND" };
    }

    if (message.includes("ECONNREFUSED") || message.includes("fetch failed")) {
      return { error: "Network connection to backend services timed out. Please retry.", code: "NETWORK_ERROR" };
    }

    return { error: message, code };
  }
}
