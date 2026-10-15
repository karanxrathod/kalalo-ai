import { env } from "../../config/env.js";
import { KalaloError } from "../../utils/errors.js";
import { MockTranscriptionProvider } from "./mock.provider.js";
import { OpenAITranscriptionProvider } from "./openai.provider.js";
import { GeminiTranscriptionProvider } from "./gemini.provider.js";
import { SettingsService } from "../settings.service.js";
import { TranscriptionProvider } from "./provider.interface.js";

export class ProviderFactory {
  public static getProvider(nameOverride?: string): TranscriptionProvider {
    let defaultProvider = "gemini";
    try {
      defaultProvider = SettingsService.getPublicSettings().provider;
    } catch {}
    const providerName = (nameOverride || defaultProvider || env.KALALO_STT_PROVIDER || "gemini").toLowerCase().trim();

    switch (providerName) {
      case "mock":
        return new MockTranscriptionProvider();
      case "gemini":
      case "google":
        return new GeminiTranscriptionProvider();
      case "openai":
        return new OpenAITranscriptionProvider();
      default:
        throw new KalaloError({
          code: "STT_PROVIDER_NOT_CONFIGURED",
          message: `Unknown or unsupported transcription provider: "${providerName}". Supported providers are: "mock", "gemini", "openai"`,
          retryable: false,
          details: { provider: providerName },
        });
    }
  }
}
