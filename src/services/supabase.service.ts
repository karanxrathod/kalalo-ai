import { getSupabaseAdminClient, getSupabaseServerClient } from "../lib/supabase/server.js";
import { isSupabaseConfigured } from "../lib/supabase/client.js";
import { CaptionSegment, Project, AspectRatio, SupportedLanguage, JobStatus, JobType } from "../types/index.js";
import { ProjectRecord } from "./db.service.js";

export class SupabaseService {
  public static isEnabled(): boolean {
    return isSupabaseConfigured();
  }

  private static getClient() {
    return getSupabaseAdminClient() || getSupabaseServerClient();
  }

  /**
   * Lists projects for an authenticated user from Supabase.
   */
  public static async listProjects(userId: string): Promise<ProjectRecord[]> {
    const supabase = this.getClient();
    if (!supabase) return [];

    const { data: projects, error } = await supabase
      .from("projects")
      .select(`
        *,
        caption_segments (
          id, start_time, end_time, text, sequence, language, confidence
        )
      `)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error || !projects) {
      console.error("[SupabaseService] Error listing projects:", error);
      return [];
    }

    return projects.map((p: any) => {
      const rawSegments = (p.caption_segments as any[]) || [];
      const sortedSegments: CaptionSegment[] = rawSegments
        .sort((a, b) => a.sequence - b.sequence || a.start_time - b.start_time)
        .map((s) => ({
          id: s.id,
          start: Number(s.start_time),
          end: Number(s.end_time),
          text: s.text,
          language: s.language,
          confidence: s.confidence ? Number(s.confidence) : undefined,
        }));

      let streamUrl = p.file_url || "";
      if (p.storage_path) {
        streamUrl = `/api/media/stream?projectId=${p.id}`;
      }

      return {
        id: p.id,
        userId: p.user_id,
        isDemo: Boolean(p.is_demo),
        name: p.name,
        fileName: p.file_name,
        filePath: p.storage_path || p.file_url || "",
        streamUrl,
        durationSeconds: Number(p.duration_seconds || 0),
        width: p.width || 1080,
        height: p.height || 1920,
        aspectRatio: (p.aspect_ratio as AspectRatio) || "9:16",
        status: p.status as any,
        language: (p.language as SupportedLanguage) || "auto",
        provider: (p.provider as any) || "gemini",
        presetId: p.preset_id || "kalalo-clean-bold",
        segments: sortedSegments,
        error: p.error_message || undefined,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    });
  }

  /**
   * Retrieves a single project by ID with its caption segments.
   */
  public static async getProject(projectId: string, userId?: string): Promise<ProjectRecord | undefined> {
    const supabase = this.getClient();
    if (!supabase) return undefined;

    let query = supabase
      .from("projects")
      .select(`
        *,
        caption_segments (
          id, start_time, end_time, text, sequence, language, confidence
        )
      `)
      .eq("id", projectId);

    if (userId) {
      query = query.or(`user_id.eq.${userId},is_demo.eq.true`);
    } else {
      query = query.eq("is_demo", true);
    }

    const { data, error } = await query.single();
    if (error || !data) {
      return undefined;
    }

    const rawSegments = (data.caption_segments as any[]) || [];
    const sortedSegments: CaptionSegment[] = rawSegments
      .sort((a, b) => a.sequence - b.sequence || a.start_time - b.start_time)
      .map((s) => ({
        id: s.id,
        start: Number(s.start_time),
        end: Number(s.end_time),
        text: s.text,
        language: s.language,
        confidence: s.confidence ? Number(s.confidence) : undefined,
      }));

    let streamUrl = data.file_url || "";
    if (data.storage_path) {
      const signed = await this.getSignedMediaUrl(data.storage_path, 3600);
      streamUrl = signed || `/api/media/stream?projectId=${data.id}`;
    }

    return {
      id: data.id,
      userId: data.user_id,
      isDemo: Boolean(data.is_demo),
      name: data.name,
      fileName: data.file_name,
      filePath: data.storage_path || data.file_url || "",
      streamUrl,
      durationSeconds: Number(data.duration_seconds || 0),
      width: data.width || 1080,
      height: data.height || 1920,
      aspectRatio: (data.aspect_ratio as AspectRatio) || "9:16",
      status: data.status as any,
      language: (data.language as SupportedLanguage) || "auto",
      provider: (data.provider as any) || "gemini",
      presetId: data.preset_id || "kalalo-clean-bold",
      segments: sortedSegments,
      error: data.error_message || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Creates a new project in Supabase with optional initial segments.
   */
  public static async createProject(params: {
    id?: string;
    userId: string;
    name: string;
    fileName: string;
    filePath?: string;
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
  }): Promise<ProjectRecord | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const projectId = params.id || `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const { error: projError } = await supabase.from("projects").insert({
      id: projectId,
      user_id: params.userId,
      name: params.name,
      file_name: params.fileName,
      storage_path: params.storagePath || params.filePath,
      file_url: params.fileUrl,
      duration_seconds: params.durationSeconds || 0,
      width: params.width || 1080,
      height: params.height || 1920,
      aspect_ratio: params.aspectRatio || "9:16",
      status: params.segments && params.segments.length > 0 ? "ready_to_edit" : "uploaded",
      language: params.language || "auto",
      provider: params.provider || "gemini",
      preset_id: params.presetId || "kalalo-clean-bold",
      is_demo: Boolean(params.isDemo),
      created_at: now,
      updated_at: now,
    });

    if (projError) {
      console.error("[SupabaseService] Failed to create project:", projError);
      return null;
    }

    if (params.segments && params.segments.length > 0) {
      await this.saveCaptionSegments(projectId, params.userId, params.segments);
    }

    return this.getProject(projectId, params.userId) as Promise<ProjectRecord>;
  }

  /**
   * Updates an existing project and its caption segments.
   */
  public static async updateProject(
    projectId: string,
    updates: Partial<Project>,
    userId?: string
  ): Promise<ProjectRecord | undefined> {
    const supabase = this.getClient();
    if (!supabase) return undefined;

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.durationSeconds !== undefined) updatePayload.duration_seconds = updates.durationSeconds;
    if (updates.width !== undefined) updatePayload.width = updates.width;
    if (updates.height !== undefined) updatePayload.height = updates.height;
    if (updates.aspectRatio !== undefined) updatePayload.aspect_ratio = updates.aspectRatio;
    if (updates.language !== undefined) updatePayload.language = updates.language;
    if (updates.provider !== undefined) updatePayload.provider = updates.provider;
    if (updates.presetId !== undefined) updatePayload.preset_id = updates.presetId;
    if (updates.error !== undefined) updatePayload.error_message = updates.error;

    let query = supabase.from("projects").update(updatePayload).eq("id", projectId);
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { error } = await query;
    if (error) {
      console.error("[SupabaseService] Failed to update project:", error);
      return undefined;
    }

    // If segments were updated, sync them to caption_segments table
    if (updates.segments) {
      const proj = await this.getProject(projectId);
      if (proj) {
        await this.saveCaptionSegments(projectId, proj.userId, updates.segments);
      }
    }

    return this.getProject(projectId, userId);
  }

  /**
   * Deletes a project and its associated segments.
   */
  public static async deleteProject(projectId: string, userId?: string): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase) return false;

    let query = supabase.from("projects").delete().eq("id", projectId);
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { error } = await query;
    return !error;
  }

  /**
   * Saves or replaces all caption segments for a project.
   */
  public static async saveCaptionSegments(
    projectId: string,
    userId: string,
    segments: CaptionSegment[]
  ): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase) return false;

    // Remove existing segments
    await supabase.from("caption_segments").delete().eq("project_id", projectId);

    if (segments.length === 0) return true;

    const rows = segments.map((seg, index) => ({
      id: seg.id || `seg-${Date.now()}-${index}`,
      project_id: projectId,
      user_id: userId,
      start_time: Number(seg.start),
      end_time: Number(seg.end),
      text: seg.text,
      sequence: index,
      language: seg.language || "en",
      confidence: seg.confidence !== undefined ? Number(seg.confidence) : 0.95,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("caption_segments").insert(rows);
    if (error) {
      console.error("[SupabaseService] Failed to insert caption segments:", error);
      return false;
    }

    return true;
  }

  /**
   * Uploads a media file buffer to Supabase Storage ('kalalo-media' bucket).
   */
  public static async uploadMediaToStorage(
    userId: string,
    projectId: string,
    fileName: string,
    buffer: Buffer,
    contentType = "video/mp4"
  ): Promise<{ storagePath: string; signedUrl: string } | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${userId}/${projectId}/${safeFileName}`;

    const { error } = await supabase.storage
      .from("kalalo-media")
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error("[SupabaseService] Storage upload failed:", error);
      return null;
    }

    const { data: signedData, error: signError } = await supabase.storage
      .from("kalalo-media")
      .createSignedUrl(storagePath, 3600);

    if (signError || !signedData?.signedUrl) {
      console.warn("[SupabaseService] Signed URL generation notice:", signError?.message);
    }

    return {
      storagePath,
      signedUrl: signedData?.signedUrl || `/api/media/stream?projectId=${projectId}`,
    };
  }

  /**
   * Creates a signed URL for a private media file in Supabase Storage.
   */
  public static async getSignedMediaUrl(storagePath: string, expiresInSeconds = 3600): Promise<string | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const { data, error } = await supabase.storage
      .from("kalalo-media")
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data) {
      return null;
    }

    return data.signedUrl;
  }

  /**
   * Job persistence operations for durable background task tracking across serverless cold starts.
   */
  public static async createJob(params: {
    id: string;
    userId: string;
    projectId?: string;
    type: JobType;
    status?: JobStatus;
    inputPath?: string;
  }): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase) return false;

    const now = new Date().toISOString();
    const { error } = await supabase.from("jobs").insert({
      id: params.id,
      user_id: params.userId,
      project_id: params.projectId || null,
      type: params.type,
      status: params.status || "queued",
      progress: 0,
      stage: "queued",
      input_path: params.inputPath || null,
      created_at: now,
      updated_at: now,
    });

    return !error;
  }

  public static async updateJob(
    jobId: string,
    updates: {
      status?: JobStatus;
      progress?: number;
      stage?: string;
      error?: any;
      result?: any;
      outputPath?: string;
      outputUrl?: string;
      startedAt?: string;
      completedAt?: string;
    }
  ): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase) return false;

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.progress !== undefined) updatePayload.progress = updates.progress;
    if (updates.stage !== undefined) updatePayload.stage = updates.stage;
    if (updates.error !== undefined) updatePayload.error = updates.error;
    if (updates.result !== undefined) updatePayload.result = updates.result;
    if (updates.outputPath !== undefined) updatePayload.output_path = updates.outputPath;
    if (updates.outputUrl !== undefined) updatePayload.output_url = updates.outputUrl;
    if (updates.startedAt !== undefined) updatePayload.started_at = updates.startedAt;
    if (updates.completedAt !== undefined) updatePayload.completed_at = updates.completedAt;

    const { error } = await supabase.from("jobs").update(updatePayload).eq("id", jobId);
    return !error;
  }

  public static async getJob(jobId: string): Promise<any | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();
    if (error || !data) return null;
    return data;
  }
}
