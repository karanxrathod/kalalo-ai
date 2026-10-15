import { CaptionSegment, TranscriptionLanguage } from "../../types/index.js";

export interface TranscriptionProgress {
  stage: string;
  progress?: number;
}

export interface TranscriptionInput {
  inputPath: string;
  language: TranscriptionLanguage;
  apiKey?: string;
  model?: string;
  signal?: AbortSignal;
  onProgress?: (progress: TranscriptionProgress) => void;
}

export interface TranscriptionResult {
  segments: CaptionSegment[];
  detectedLanguage?: string;
  provider: string;
}

export interface TranscriptionProvider {
  readonly name: string;
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
}
