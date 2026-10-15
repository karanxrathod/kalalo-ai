import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import { AspectRatio, SupportedLanguage } from "../types/index.js";
import { DbService } from "./db.service.js";

export interface UserSettings {
  geminiApiKey?: string;
  openaiApiKey?: string;
  defaultProvider: "mock" | "gemini" | "openai";
  defaultModel: string;
  defaultLanguage: SupportedLanguage | "auto";
  defaultAspectRatio: AspectRatio;
  defaultPreset: string;
}

export class SettingsService {
  private static migratedOldSettings = false;

  private static checkAndMigrateLegacyFile(): void {
    if (this.migratedOldSettings) return;
    this.migratedOldSettings = true;
    try {
      const legacyPath = path.resolve(process.cwd(), "tmp", "user-settings.json");
      if (fs.existsSync(legacyPath)) {
        const raw = JSON.parse(fs.readFileSync(legacyPath, "utf-8"));
        if (raw.geminiApiKey && typeof raw.geminiApiKey === "string") {
          DbService.saveGeminiApiKey(raw.geminiApiKey);
        }
        if (raw.defaultProvider || raw.defaultModel) {
          DbService.savePreferences({
            defaultProvider: raw.defaultProvider,
            defaultModel: raw.defaultModel,
            defaultLanguage: raw.defaultLanguage,
            defaultAspectRatio: raw.defaultAspectRatio,
            defaultPreset: raw.defaultPreset,
          });
        }
      }
    } catch {}
  }

  public static getGeminiApiKey(requestKey?: string, userId = "usr_creator_default"): string | undefined {
    if (requestKey && requestKey.trim().length > 0) {
      return requestKey.trim();
    }
    this.checkAndMigrateLegacyFile();
    const saved = DbService.getDecryptedGeminiKey(userId);
    if (saved && saved.trim().length > 0) {
      return saved.trim();
    }
    if (userId !== "usr_creator_default") {
      const defaultStudioKey = DbService.getDecryptedGeminiKey("usr_creator_default");
      if (defaultStudioKey && defaultStudioKey.trim().length > 0) {
        return defaultStudioKey.trim();
      }
    }
    return env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
  }

  public static getOpenAiApiKey(requestKey?: string): string | undefined {
    if (requestKey && requestKey.trim().length > 0) {
      return requestKey.trim();
    }
    return env.OPENAI_API_KEY;
  }

  public static saveGeminiApiKey(key: string, userId = "usr_creator_default"): void {
    this.checkAndMigrateLegacyFile();
    DbService.saveGeminiApiKey(key, userId);
  }

  public static removeGeminiApiKey(userId = "usr_creator_default"): void {
    this.checkAndMigrateLegacyFile();
    DbService.removeGeminiApiKey(userId);
  }

  public static savePreferences(
    prefs: {
      defaultProvider?: "mock" | "gemini" | "openai";
      defaultModel?: string;
      defaultLanguage?: SupportedLanguage | "auto";
      defaultAspectRatio?: AspectRatio;
      defaultPreset?: string;
    },
    userId = "usr_creator_default"
  ): void {
    this.checkAndMigrateLegacyFile();
    DbService.savePreferences(prefs, userId);
  }

  public static getPublicSettings(userId = "usr_creator_default") {
    this.checkAndMigrateLegacyFile();
    const current = DbService.getUserSettings(userId);
    const geminiKey = this.getGeminiApiKey(undefined, userId);
    const openaiKey = this.getOpenAiApiKey();

    const maskKey = (key?: string) => {
      if (!key || key.length < 8) return "";
      return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
    };

    return {
      provider: current.defaultProvider || env.KALALO_STT_PROVIDER || "gemini",
      model: current.defaultModel || (current.defaultProvider === "gemini" ? (current.defaultModel || env.KALALO_GEMINI_MODEL || "gemini-1.5-flash") : "whisper-1"),
      language: current.defaultLanguage || env.KALALO_STT_LANGUAGE || "auto",
      aspectRatio: current.defaultAspectRatio || env.KALALO_DEFAULT_ASPECT_RATIO || "9:16",
      defaultPreset: current.defaultPreset || "kalalo-clean-bold",
      gemini: {
        hasKey: Boolean(geminiKey && geminiKey.length > 0),
        maskedKey: maskKey(geminiKey),
        model: current.defaultModel || env.KALALO_GEMINI_MODEL || "gemini-1.5-flash",
      },
      openai: {
        hasKey: Boolean(openaiKey && openaiKey.length > 0),
        maskedKey: maskKey(openaiKey),
        model: env.KALALO_STT_MODEL || "whisper-1",
      },
    };
  }

  public static async listAvailableGeminiModels(keyToTest?: string): Promise<string[]> {
    const key = keyToTest || this.getGeminiApiKey();
    if (!key) return [];
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key.trim())}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = (await res.json()) as any;
      const contentModels = (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => m.name.replace(/^models\//, ""));
      return contentModels;
    } catch {
      return [];
    }
  }

  public static async testGeminiConnection(keyToTest?: string, modelToTest?: string): Promise<{
    success: boolean;
    message: string;
    model?: string;
  }> {
    const key = keyToTest || this.getGeminiApiKey();
    if (!key || key.trim().length === 0) {
      return {
        success: false,
        message: "No Gemini API key provided to test. Please enter a valid API key.",
      };
    }

    const current = DbService.getUserSettings();
    const model = modelToTest || current.defaultModel || env.KALALO_GEMINI_MODEL || "gemini-3.5-flash-lite";

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key.trim())}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: "Respond with the word 'OK' only." }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 5,
            temperature: 0.1,
          },
        }),
      });

      const data = (await res.json()) as any;

      if (!res.ok) {
        const errorMsg = data.error?.message || `HTTP ${res.status} from Google Gemini API`;
        if (res.status === 404) {
          const available = await this.listAvailableGeminiModels(key);
          const suggestion = available.length > 0 ? ` Available models: ${available.slice(0, 5).join(", ")}.` : "";
          return {
            success: false,
            message: `Model "${model}" was not found or is no longer supported on API v1beta.${suggestion} We recommend "gemini-3.5-flash-lite".`,
          };
        }
        if (res.status === 503) {
          return {
            success: false,
            message: `Google Gemini servers are temporarily experiencing high demand on "${model}". Spikes are temporary; you can select "gemini-3.5-flash-lite" or try again in a few moments.`,
          };
        }
        if (res.status === 400 || res.status === 403) {
          return {
            success: false,
            message: `Invalid API key or unauthorized: ${errorMsg}`,
          };
        }
        if (res.status === 429) {
          return {
            success: false,
            message: `Quota or rate limit reached on your Gemini account: ${errorMsg}`,
          };
        }
        return {
          success: false,
          message: `Gemini API test failed: ${errorMsg}`,
        };
      }

      return {
        success: true,
        message: `Successfully connected to Google Gemini (${model})! Speech transcription is ready.`,
        model,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: `Network error connecting to Gemini API: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
