import { KalaloErrorDetails } from "../utils/errors.js";

export type SupportedLanguage = "hinglish" | "hi" | "en";
export type TranscriptionLanguage = "auto" | SupportedLanguage;
export type AspectRatio = "9:16" | "1:1" | "16:9";

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  language?: SupportedLanguage;
  confidence?: number;
  speakerId?: string;
}

export type JobType = "transcription" | "rendering";

export type JobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancel_requested"
  | "cancelled";

export interface Job<TResult = unknown> {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  stage: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: KalaloErrorDetails;
  result?: TResult;
}

export interface VideoStreamInfo {
  codec: string;
  width: number;
  height: number;
  aspectRatio?: string;
  fps?: number;
  bitrate?: number;
}

export interface AudioStreamInfo {
  codec: string;
  channels: number;
  sampleRate: number;
  bitrate?: number;
}

export interface MediaMetadata {
  format: string;
  durationSeconds: number;
  hasAudio: boolean;
  hasVideo: boolean;
  sizeBytes?: number;
  bitrate?: number;
  video?: VideoStreamInfo;
  audio?: AudioStreamInfo;
}

export interface PresetStyle {
  id: string;
  name: string;
  description: string;
  category?: "Social" | "Professional" | "Cinematic" | "Educational" | "Accessibility";
  fontFamily: string;
  fontSize: number; // default base font size
  primaryColor: string; // Hex or ASS format
  accentColor?: string;
  outlineColor: string;
  outlineWidth: number;
  shadowColor?: string;
  shadowDepth: number;
  alignment: number; // ASS alignment code (e.g. 2 = bottom-center)
  positionX?: number; // 0-100% horizontal center
  positionY?: number; // 0-100% vertical center
  marginV: number;
  marginL: number;
  marginR: number;
  boxColor?: string;
  backgroundTreatment?: "none" | "solid_box" | "translucent_box" | "highlight_box" | "outline_only";
  backgroundOpacity?: number; // 0 to 1
  supportedAspectRatios: AspectRatio[];
  targetLanguages?: SupportedLanguage[];
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface RenderProgress {
  stage: string;
  progress: number;
  currentTimeSeconds?: number;
  totalDurationSeconds?: number;
  speed?: string;
  fps?: number;
}

export type ProjectStatus =
  | "uploaded"
  | "transcribing"
  | "ready_to_edit"
  | "rendering"
  | "completed"
  | "failed";

export interface Project {
  id: string;
  name: string;
  fileName: string;
  filePath: string;
  storagePath?: string;
  fileUrl?: string;
  streamUrl: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  width?: number;
  height?: number;
  aspectRatio: AspectRatio;
  status: ProjectStatus;
  language: SupportedLanguage | "auto";
  provider: "gemini" | "mock" | "openai";
  segments: CaptionSegment[];
  presetId: string;
  customPreset?: PresetStyle;
  renderedVideoPath?: string;
  renderedStreamUrl?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}
