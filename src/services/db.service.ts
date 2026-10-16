import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { AspectRatio, CaptionSegment, Job, JobStatus, JobType, Project, SupportedLanguage } from "../types/index.js";
import { encryptSecret, decryptSecret } from "../utils/crypto.js";
import { ensureDir } from "../utils/paths.js";
import { env } from "../config/env.js";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettingsRecord {
  userId: string;
  geminiApiKeyEncrypted?: string;
  openaiApiKeyEncrypted?: string;
  defaultProvider?: "mock" | "gemini" | "openai";
  defaultModel?: string;
  defaultLanguage?: SupportedLanguage | "auto";
  defaultAspectRatio?: AspectRatio;
  defaultPreset?: string;
  updatedAt: string;
}

export interface ProjectRecord extends Project {
  userId: string;
  isDemo?: boolean;
}

export interface JobRecord<T = unknown> extends Job<T> {
  userId?: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  userSettings: UserSettingsRecord[];
  projects: ProjectRecord[];
  jobs: JobRecord[];
}

const DB_FILE_PATH = path.resolve(process.env.VERCEL ? "/tmp" : process.cwd(), "tmp", "kalalo_database.json");

export class DbService {
  private static cachedDb: DatabaseSchema | null = null;

  private static loadDatabase(): DatabaseSchema {
    if (this.cachedDb) return this.cachedDb;

    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.projects)) {
          this.cachedDb = parsed;
          return this.cachedDb!;
        }
      }
    } catch {}

    // Initialize with default seeded state
    const initialDb = this.createInitialDatabase();
    this.saveDatabase(initialDb);
    this.cachedDb = initialDb;
    return initialDb;
  }

  private static createInitialDatabase(): DatabaseSchema {
    const now = new Date().toISOString();
    const demoSalt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync("Creator123!", demoSalt);

    const defaultUser: UserRecord = {
      id: "usr_creator_default",
      email: "creator@kalalo.ai",
      name: "Kalalo Creator",
      passwordHash: demoPasswordHash,
      createdAt: now,
      updatedAt: now,
    };

    // Pre-seed Welcome Sample project for the default creator
    const sampleVideoPath = path.resolve(process.cwd(), "samples", "sample-video.mp4");
    const sampleExists = fs.existsSync(sampleVideoPath);

    const defaultProjects: ProjectRecord[] = sampleExists
      ? [
          {
            id: "proj-welcome-kalalo",
            userId: defaultUser.id,
            isDemo: true,
            name: "Welcome to Kalalo",
            fileName: "sample-video.mp4",
            filePath: sampleVideoPath,
            streamUrl: `/api/media/stream?path=${encodeURIComponent(sampleVideoPath)}`,
            durationSeconds: 5.4,
            width: 720,
            height: 1280,
            aspectRatio: "9:16",
            status: "ready_to_edit",
            language: "en",
            provider: "gemini",
            segments: [
              {
                id: "gemini-seg-1",
                start: 0.05,
                end: 1.80,
                text: "Welcome to Kalalo.",
                language: "en",
                confidence: 0.98,
              },
              {
                id: "gemini-seg-2",
                start: 2.10,
                end: 4.80,
                text: "Create crisp captions with Google Gemini AI.",
                language: "en",
                confidence: 0.98,
              },
            ],
            presetId: "kalalo-clean-bold",
            createdAt: now,
            updatedAt: now,
          },
        ]
      : [];

    return {
      users: [defaultUser],
      userSettings: [],
      projects: defaultProjects,
      jobs: [],
    };
  }

  private static saveDatabase(data: DatabaseSchema): void {
    ensureDir(path.dirname(DB_FILE_PATH));
    const tempFile = `${DB_FILE_PATH}.${crypto.randomUUID()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    try {
      fs.renameSync(tempFile, DB_FILE_PATH);
    } catch {
      // Fallback for Windows file locks
      fs.copyFileSync(tempFile, DB_FILE_PATH);
      try {
        fs.unlinkSync(tempFile);
      } catch {}
    }
    this.cachedDb = data;
  }

  // --- USER OPERATIONS ---

  public static findUserByEmail(email: string): UserRecord | undefined {
    const db = this.loadDatabase();
    return db.users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
  }

  public static findUserById(id: string): UserRecord | undefined {
    const db = this.loadDatabase();
    return db.users.find((u) => u.id === id);
  }

  public static createUser(params: { email: string; name: string; password: string }): UserRecord {
    const db = this.loadDatabase();
    const cleanEmail = params.email.toLowerCase().trim();

    if (this.findUserByEmail(cleanEmail)) {
      throw new Error("A user with this email address already exists.");
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(params.password, salt);
    const now = new Date().toISOString();
    const newUser: UserRecord = {
      id: `usr_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      email: cleanEmail,
      name: params.name.trim() || cleanEmail.split("@")[0],
      passwordHash,
      role: "creator",
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(newUser);

    // Pre-seed an onboarding Demo Project for the new user so they can test immediately
    const sampleVideoPath = path.resolve(process.cwd(), "samples", "sample-video.mp4");
    if (fs.existsSync(sampleVideoPath)) {
      db.projects.push({
        id: `proj-demo-${newUser.id}`,
        userId: newUser.id,
        isDemo: true,
        name: "Demo: Getting Started with Kalalo",
        fileName: "sample-video.mp4",
        filePath: sampleVideoPath,
        streamUrl: `/api/media/stream?path=${encodeURIComponent(sampleVideoPath)}`,
        durationSeconds: 5.4,
        width: 720,
        height: 1280,
        aspectRatio: "9:16",
        status: "ready_to_edit",
        language: "en",
        provider: "gemini",
        segments: [
          {
            id: "demo-seg-1",
            start: 0.05,
            end: 1.80,
            text: "Welcome to Kalalo.",
            language: "en",
            confidence: 0.98,
          },
          {
            id: "demo-seg-2",
            start: 2.10,
            end: 4.80,
            text: "Create crisp captions with Google Gemini AI.",
            language: "en",
            confidence: 0.98,
          },
        ],
        presetId: "kalalo-clean-bold",
        createdAt: now,
        updatedAt: now,
      });
    }

    this.saveDatabase(db);
    return newUser;
  }

  // --- PROJECT OPERATIONS (PER-USER ISOLATION) ---

  public static listProjects(userId?: string): ProjectRecord[] {
    const db = this.loadDatabase();
    let list = db.projects;
    if (userId) {
      list = list.filter((p) => p.userId === userId);
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public static getProject(id: string, userId?: string): ProjectRecord | undefined {
    const db = this.loadDatabase();
    const proj = db.projects.find((p) => p.id === id);
    if (!proj) return undefined;
    // If userId provided, enforce tenant ownership (unless it's an unauthenticated local MCP call)
    if (userId && proj.userId && proj.userId !== userId) {
      return undefined;
    }
    return proj;
  }

  public static createProject(params: {
    userId?: string;
    name?: string;
    fileName: string;
    filePath: string;
    storagePath?: string;
    fileUrl?: string;
    durationSeconds?: number;
    width?: number;
    height?: number;
    aspectRatio?: AspectRatio;
    language?: SupportedLanguage | "auto";
    provider?: "gemini" | "mock" | "openai";
    segments?: CaptionSegment[];
    presetId?: string;
    isDemo?: boolean;
  }): ProjectRecord {
    const db = this.loadDatabase();
    const now = new Date().toISOString();
    const id = `proj-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const effectiveUserId = params.userId || "usr_creator_default";

    const streamUrl =
      params.fileUrl ||
      (params.storagePath
        ? `/api/media/stream?path=${encodeURIComponent(params.storagePath)}`
        : `/api/media/stream?path=${encodeURIComponent(params.filePath)}`);

    const newProject: ProjectRecord = {
      id,
      userId: effectiveUserId,
      isDemo: Boolean(params.isDemo),
      name: params.name || params.fileName.replace(/\.[^/.]+$/, ""),
      fileName: params.fileName,
      filePath: params.filePath,
      streamUrl,
      durationSeconds: params.durationSeconds || 1.0,
      width: params.width || 1080,
      height: params.height || 1920,
      aspectRatio: params.aspectRatio || "9:16",
      status: params.segments && params.segments.length > 0 ? "ready_to_edit" : "uploaded",
      language: params.language || "auto",
      provider: params.provider || "gemini",
      segments: params.segments || [],
      presetId: params.presetId || "kalalo-clean-bold",
      createdAt: now,
      updatedAt: now,
    };

    db.projects.unshift(newProject);
    this.saveDatabase(db);
    return newProject;
  }

  public static updateProject(id: string, updates: Partial<ProjectRecord>, userId?: string): ProjectRecord | undefined {
    const db = this.loadDatabase();
    const idx = db.projects.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;

    const current = db.projects[idx];
    if (userId && current.userId && current.userId !== userId) {
      return undefined; // unauthorized
    }

    const updated: ProjectRecord = {
      ...current,
      ...updates,
      id: current.id,
      userId: current.userId,
      updatedAt: new Date().toISOString(),
    };

    db.projects[idx] = updated;
    this.saveDatabase(db);
    return updated;
  }

  public static deleteProject(id: string, userId?: string): boolean {
    const db = this.loadDatabase();
    const idx = db.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    const current = db.projects[idx];
    if (userId && current.userId && current.userId !== userId) {
      return false; // unauthorized
    }

    db.projects.splice(idx, 1);
    this.saveDatabase(db);
    return true;
  }

  // --- USER SETTINGS & SECURE CREDENTIALS ---

  public static getUserSettings(userId = "usr_creator_default"): UserSettingsRecord {
    const db = this.loadDatabase();
    let record = db.userSettings.find((s) => s.userId === userId);
    if (!record) {
      record = {
        userId,
        defaultProvider: "gemini",
        defaultModel: "gemini-1.5-flash",
        defaultLanguage: "auto",
        defaultAspectRatio: "9:16",
        defaultPreset: "kalalo-clean-bold",
        updatedAt: new Date().toISOString(),
      };
      db.userSettings.push(record);
      this.saveDatabase(db);
    }
    return record;
  }

  public static saveGeminiApiKey(apiKey: string, userId = "usr_creator_default"): void {
    const db = this.loadDatabase();
    let record = db.userSettings.find((s) => s.userId === userId);
    if (!record) {
      record = this.getUserSettings(userId);
    }
    record.geminiApiKeyEncrypted = encryptSecret(apiKey.trim());
    record.updatedAt = new Date().toISOString();
    this.saveDatabase(db);
  }

  public static removeGeminiApiKey(userId = "usr_creator_default"): void {
    const db = this.loadDatabase();
    const record = db.userSettings.find((s) => s.userId === userId);
    if (record) {
      delete record.geminiApiKeyEncrypted;
      record.updatedAt = new Date().toISOString();
      this.saveDatabase(db);
    }
  }

  public static getDecryptedGeminiKey(userId = "usr_creator_default"): string | undefined {
    const record = this.getUserSettings(userId);
    if (record.geminiApiKeyEncrypted) {
      const decrypted = decryptSecret(record.geminiApiKeyEncrypted);
      if (decrypted && decrypted.trim().length > 0) return decrypted;
    }
    // Fallback to environment variables
    return env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
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
    const db = this.loadDatabase();
    const record = this.getUserSettings(userId);
    if (prefs.defaultProvider) record.defaultProvider = prefs.defaultProvider;
    if (prefs.defaultModel) record.defaultModel = prefs.defaultModel;
    if (prefs.defaultLanguage) record.defaultLanguage = prefs.defaultLanguage;
    if (prefs.defaultAspectRatio) record.defaultAspectRatio = prefs.defaultAspectRatio;
    if (prefs.defaultPreset) record.defaultPreset = prefs.defaultPreset;
    record.updatedAt = new Date().toISOString();
    this.saveDatabase(db);
  }

  // --- PERSISTENT JOB OPERATIONS ---

  public static saveJob<T>(job: Job<T>, userId?: string): void {
    const db = this.loadDatabase();
    const idx = db.jobs.findIndex((j) => j.id === job.id);
    const record: JobRecord<T> = {
      ...job,
      userId,
    };
    if (idx !== -1) {
      db.jobs[idx] = record as JobRecord;
    } else {
      db.jobs.unshift(record as JobRecord);
      // Keep max 200 jobs
      if (db.jobs.length > 200) {
        db.jobs = db.jobs.slice(0, 200);
      }
    }
    this.saveDatabase(db);
  }

  public static getJob<T = unknown>(jobId: string, userId?: string): JobRecord<T> | undefined {
    const db = this.loadDatabase();
    const job = db.jobs.find((j) => j.id === jobId) as JobRecord<T> | undefined;
    if (!job) return undefined;
    if (userId && job.userId && job.userId !== userId) {
      return undefined;
    }
    return job;
  }

  public static listJobs(filter?: { status?: JobStatus; limit?: number; userId?: string }): JobRecord[] {
    const db = this.loadDatabase();
    let jobs = db.jobs;
    if (filter?.userId) {
      jobs = jobs.filter((j) => !j.userId || j.userId === filter.userId);
    }
    if (filter?.status) {
      jobs = jobs.filter((j) => j.status === filter.status);
    }
    if (filter?.limit && filter.limit > 0) {
      jobs = jobs.slice(0, filter.limit);
    }
    return jobs;
  }
}
