import { MediaMetadata, VideoStreamInfo, AudioStreamInfo } from "../types/index.js";
import { KalaloError } from "../utils/errors.js";
import { validateInputPath } from "../utils/paths.js";
import { spawnSafe, resolveFfprobePath } from "../utils/process.js";

export class MediaService {
  /**
   * Inspects a video or audio file using FFprobe and extracts real metadata.
   */
  public static async inspectMedia(inputPath: string): Promise<MediaMetadata> {
    const validPath = validateInputPath(inputPath);
    const ffprobePath = resolveFfprobePath();

    const args = [
      "-v",
      "error",
      "-show_format",
      "-show_streams",
      "-print_format",
      "json",
      validPath,
    ];

    try {
      const result = await spawnSafe(ffprobePath, args, { timeoutMs: 15000 });
      const data = JSON.parse(result.stdout);

      const format = data.format || {};
      const streams = Array.isArray(data.streams) ? data.streams : [];

      const videoStream = streams.find(
        (s: Record<string, unknown>) =>
          s.codec_type === "video" && s.disposition !== undefined
            ? !(s.disposition as Record<string, unknown>)?.attached_pic
            : s.codec_type === "video"
      );

      const audioStream = streams.find(
        (s: Record<string, unknown>) => s.codec_type === "audio"
      );

      const durationRaw =
        format.duration || (videoStream && videoStream.duration) || (audioStream && audioStream.duration);
      const durationSeconds = durationRaw ? Math.max(0, parseFloat(durationRaw)) : 0;

      let videoInfo: VideoStreamInfo | undefined;
      if (videoStream) {
        let fps: number | undefined;
        if (typeof videoStream.r_frame_rate === "string" && videoStream.r_frame_rate.includes("/")) {
          const [num, den] = videoStream.r_frame_rate.split("/").map(Number);
          if (den > 0) fps = Math.round((num / den) * 100) / 100;
        }

        videoInfo = {
          codec: String(videoStream.codec_name || "unknown"),
          width: Number(videoStream.width || 0),
          height: Number(videoStream.height || 0),
          aspectRatio: videoStream.display_aspect_ratio
            ? String(videoStream.display_aspect_ratio)
            : undefined,
          fps,
          bitrate: videoStream.bit_rate ? Number(videoStream.bit_rate) : undefined,
        };
      }

      let audioInfo: AudioStreamInfo | undefined;
      if (audioStream) {
        audioInfo = {
          codec: String(audioStream.codec_name || "unknown"),
          channels: Number(audioStream.channels || 0),
          sampleRate: Number(audioStream.sample_rate || 0),
          bitrate: audioStream.bit_rate ? Number(audioStream.bit_rate) : undefined,
        };
      }

      return {
        format: String(format.format_name || "unknown"),
        durationSeconds,
        hasAudio: Boolean(audioStream),
        hasVideo: Boolean(videoStream),
        sizeBytes: format.size ? Number(format.size) : undefined,
        bitrate: format.bit_rate ? Number(format.bit_rate) : undefined,
        video: videoInfo,
        audio: audioInfo,
      };
    } catch (err: unknown) {
      if (err instanceof KalaloError) {
        throw err;
      }
      throw new KalaloError({
        code: "UNSUPPORTED_MEDIA",
        message: `Failed to inspect media file: ${err instanceof Error ? err.message : String(err)}`,
        retryable: false,
        details: { inputPath: validPath },
      });
    }
  }
}
