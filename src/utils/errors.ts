export type KalaloErrorCode =
  | "INVALID_INPUT"
  | "MEDIA_NOT_FOUND"
  | "UNSUPPORTED_MEDIA"
  | "FFMPEG_NOT_FOUND"
  | "FFPROBE_NOT_FOUND"
  | "STT_PROVIDER_NOT_CONFIGURED"
  | "STT_PROVIDER_ERROR"
  | "INVALID_SEGMENTS"
  | "PRESET_NOT_FOUND"
  | "JOB_NOT_FOUND"
  | "JOB_NOT_CANCELLABLE"
  | "RENDER_FAILED"
  | "OUTPUT_VERIFICATION_FAILED"
  | "PROCESS_TIMEOUT"
  | "PROCESS_CANCELLED";

export interface KalaloErrorDetails {
  code: KalaloErrorCode | string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export class KalaloError extends Error {
  public readonly code: KalaloErrorCode | string;
  public readonly retryable: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(payload: KalaloErrorDetails) {
    super(payload.message);
    this.name = "KalaloError";
    this.code = payload.code;
    this.retryable = payload.retryable;
    this.details = payload.details;
    Object.setPrototypeOf(this, KalaloError.prototype);
  }

  toJSON(): KalaloErrorDetails {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}
