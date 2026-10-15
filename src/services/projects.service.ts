import { Project, CaptionSegment, AspectRatio, SupportedLanguage } from "../types/index.js";
import { DbService, ProjectRecord } from "./db.service.js";

export class ProjectsService {
  public static listProjects(userId?: string): ProjectRecord[] {
    return DbService.listProjects(userId);
  }

  public static getProject(id: string, userId?: string): ProjectRecord | undefined {
    return DbService.getProject(id, userId);
  }

  public static createProject(params: {
    userId?: string;
    name?: string;
    fileName: string;
    filePath: string;
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
    return DbService.createProject(params);
  }

  public static updateProject(id: string, updates: Partial<Project>, userId?: string): ProjectRecord | undefined {
    return DbService.updateProject(id, updates, userId);
  }

  public static deleteProject(id: string, userId?: string): boolean {
    return DbService.deleteProject(id, userId);
  }
}
