import { Project, CaptionSegment, AspectRatio, SupportedLanguage } from "../types/index.js";
import { DbService, ProjectRecord } from "./db.service.js";
import { SupabaseService } from "./supabase.service.js";

export class ProjectsService {
  /**
   * Synchronous list projects (local JSON database).
   */
  public static listProjects(userId?: string): ProjectRecord[] {
    return DbService.listProjects(userId);
  }

  /**
   * Asynchronous list projects (Supabase PostgreSQL when configured, local DB fallback).
   */
  public static async listProjectsAsync(userId?: string): Promise<ProjectRecord[]> {
    if (SupabaseService.isEnabled() && userId) {
      const projects = await SupabaseService.listProjects(userId);
      if (projects.length > 0) return projects;
    }
    return DbService.listProjects(userId);
  }

  /**
   * Synchronous get project.
   */
  public static getProject(id: string, userId?: string): ProjectRecord | undefined {
    return DbService.getProject(id, userId);
  }

  /**
   * Asynchronous get project (queries Supabase with caption segments).
   */
  public static async getProjectAsync(id: string, userId?: string): Promise<ProjectRecord | undefined> {
    if (SupabaseService.isEnabled()) {
      const proj = await SupabaseService.getProject(id, userId);
      if (proj) return proj;
    }
    return DbService.getProject(id, userId);
  }

  /**
   * Synchronous create project.
   */
  public static createProject(params: {
    id?: string;
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
    const local = DbService.createProject(params);
    // Background sync to Supabase if enabled
    if (SupabaseService.isEnabled() && params.userId) {
      SupabaseService.createProject({
        id: local.id,
        userId: params.userId,
        name: local.name,
        fileName: local.fileName,
        filePath: local.filePath,
        storagePath: params.storagePath,
        fileUrl: params.fileUrl,
        durationSeconds: local.durationSeconds,
        width: local.width,
        height: local.height,
        aspectRatio: local.aspectRatio,
        language: local.language,
        provider: local.provider as any,
        presetId: local.presetId,
        segments: local.segments,
        isDemo: local.isDemo,
      }).catch((e) => console.error("[ProjectsService] Async Supabase sync error:", e));
    }
    return local;
  }

  /**
   * Asynchronous create project with immediate Supabase write.
   */
  public static async createProjectAsync(params: {
    id?: string;
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
  }): Promise<ProjectRecord> {
    const local = DbService.createProject(params);
    if (SupabaseService.isEnabled() && params.userId) {
      const supa = await SupabaseService.createProject({
        id: local.id,
        userId: params.userId,
        name: local.name,
        fileName: local.fileName,
        filePath: local.filePath,
        storagePath: params.storagePath,
        fileUrl: params.fileUrl,
        durationSeconds: local.durationSeconds,
        width: local.width,
        height: local.height,
        aspectRatio: local.aspectRatio,
        language: local.language,
        provider: local.provider as any,
        presetId: local.presetId,
        segments: local.segments,
        isDemo: local.isDemo,
      });
      if (supa) return supa;
    }
    return local;
  }

  /**
   * Synchronous update project.
   */
  public static updateProject(id: string, updates: Partial<Project>, userId?: string): ProjectRecord | undefined {
    const updated = DbService.updateProject(id, updates, userId);
    if (SupabaseService.isEnabled()) {
      SupabaseService.updateProject(id, updates, userId).catch((e) =>
        console.error("[ProjectsService] Async Supabase update error:", e)
      );
    }
    return updated;
  }

  /**
   * Asynchronous update project.
   */
  public static async updateProjectAsync(
    id: string,
    updates: Partial<Project>,
    userId?: string
  ): Promise<ProjectRecord | undefined> {
    const local = DbService.updateProject(id, updates, userId);
    if (SupabaseService.isEnabled()) {
      const supa = await SupabaseService.updateProject(id, updates, userId);
      if (supa) return supa;
    }
    return local;
  }

  /**
   * Synchronous delete project.
   */
  public static deleteProject(id: string, userId?: string): boolean {
    if (SupabaseService.isEnabled()) {
      SupabaseService.deleteProject(id, userId).catch((e) =>
        console.error("[ProjectsService] Async Supabase delete error:", e)
      );
    }
    return DbService.deleteProject(id, userId);
  }

  /**
   * Asynchronous delete project.
   */
  public static async deleteProjectAsync(id: string, userId?: string): Promise<boolean> {
    if (SupabaseService.isEnabled()) {
      await SupabaseService.deleteProject(id, userId);
    }
    return DbService.deleteProject(id, userId);
  }
}
