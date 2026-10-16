import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { validateMediaServingPath } from "@/src/utils/paths";
import { AuthService } from "@/src/services/auth.service";
import { ProjectsService } from "@/src/services/projects.service";
import { SupabaseService } from "@/src/services/supabase.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const filePathParam = searchParams.get("path");
    const isSample = searchParams.get("sample") === "true";

    // 1. Check for public sample video asset (no authentication required)
    const isSampleAsset =
      isSample ||
      (filePathParam && (
        filePathParam === "sample-video.mp4" ||
        filePathParam.endsWith("/sample-video.mp4") ||
        filePathParam.endsWith("\\sample-video.mp4") ||
        filePathParam.includes("samples/sample-video.mp4")
      ));

    if (isSampleAsset) {
      const sampleFile = path.resolve(process.cwd(), "samples", "sample-video.mp4");
      const fallbackFile = path.resolve(process.cwd(), "public", "sample-video.mp4");
      const resolved = fs.existsSync(sampleFile) ? sampleFile : fallbackFile;
      if (fs.existsSync(resolved)) {
        return serveLocalMediaStream(request, resolved, searchParams);
      }
    }

    // 2. Authentication check for all private user media
    const session = await AuthService.getUserFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Authentication required to stream private media" },
        { status: 401 }
      );
    }

    // 3. Resolve through projectId if provided (canonical secure route)
    if (projectId) {
      const project = await ProjectsService.getProjectAsync(projectId, session.userId);
      if (!project) {
        return NextResponse.json(
          { error: "Project not found or access denied" },
          { status: 404 }
        );
      }

      // Check ownership or demo project access
      if (project.userId !== session.userId && !project.isDemo) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to access this media" },
          { status: 403 }
        );
      }

      // If project has Supabase storagePath, generate fresh signed URL and redirect
      if (project.storagePath) {
        const signedUrl = await SupabaseService.getSignedMediaUrl(project.storagePath, 3600);
        if (signedUrl) {
          return NextResponse.redirect(signedUrl, 307);
        }
      }

      // If project has direct streamUrl that is already a valid signed URL
      if (project.streamUrl && project.streamUrl.includes("token=")) {
        return NextResponse.redirect(project.streamUrl, 307);
      }

      // If project has local filePath and it exists on disk
      if (project.filePath && fs.existsSync(project.filePath)) {
        return serveLocalMediaStream(request, project.filePath, searchParams);
      }

      return NextResponse.json(
        { error: "Media file not found in storage" },
        { status: 404 }
      );
    }

    // 4. Resolve through path parameter
    if (!filePathParam) {
      return NextResponse.json(
        { error: "Missing required projectId or path parameter" },
        { status: 400 }
      );
    }

    // If path is a remote HTTP/HTTPS URL, verify it is a trusted signed Supabase URL
    if (filePathParam.startsWith("http://") || filePathParam.startsWith("https://")) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && filePathParam.startsWith(supabaseUrl) && filePathParam.includes("token=")) {
        return NextResponse.redirect(filePathParam, 307);
      }
      return NextResponse.json(
        { error: "Forbidden: Untrusted or unauthorized media URL" },
        { status: 403 }
      );
    }

    // If path is a Supabase Storage path (e.g. userId/projectId/filename)
    // Enforce that the path belongs to the authenticated user!
    if (filePathParam.startsWith(`${session.userId}/`)) {
      const signedUrl = await SupabaseService.getSignedMediaUrl(filePathParam, 3600);
      if (signedUrl) {
        return NextResponse.redirect(signedUrl, 307);
      }
      return NextResponse.json(
        { error: "Failed to generate secure streaming URL" },
        { status: 404 }
      );
    }

    // If path does not start with session.userId, check if it exists as a validated local file
    if (fs.existsSync(filePathParam)) {
      const resolved = validateMediaServingPath(filePathParam);
      return serveLocalMediaStream(request, resolved, searchParams);
    }

    // Path does not belong to user and does not exist locally
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to access media at this path" },
      { status: 403 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function serveLocalMediaStream(
  request: NextRequest,
  resolved: string,
  searchParams: URLSearchParams
) {
  const stats = fs.statSync(resolved);
  const fileSize = stats.size;

  const range = request.headers.get("range");
  const isDownload = searchParams.get("download") === "true";
  const downloadFilename = searchParams.get("filename") || path.basename(resolved);
  const ext = path.extname(resolved).toLowerCase();
  const contentType =
    ext === ".srt"
      ? "text/plain; charset=utf-8"
      : ext === ".vtt"
      ? "text/vtt; charset=utf-8"
      : ext === ".mp3"
      ? "audio/mpeg"
      : ext === ".wav"
      ? "audio/wav"
      : "video/mp4";

  const commonHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
  };

  if (isDownload) {
    commonHeaders["Content-Disposition"] = `attachment; filename="${downloadFilename}"`;
  }

  if (range && !isDownload) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    let isClosed = false;
    const fileStream = fs.createReadStream(resolved, { start, end });

    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => {
          if (!isClosed) {
            try {
              controller.enqueue(chunk);
            } catch {
              isClosed = true;
              fileStream.destroy();
            }
          }
        });
        fileStream.on("end", () => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch {}
          }
        });
        fileStream.on("error", (err) => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.error(err);
            } catch {}
          }
        });
      },
      cancel() {
        isClosed = true;
        fileStream.destroy();
      },
    });

    return new NextResponse(stream, {
      status: 206,
      headers: {
        ...commonHeaders,
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": chunkSize.toString(),
      },
    });
  } else {
    let isClosed = false;
    const fileStream = fs.createReadStream(resolved);
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => {
          if (!isClosed) {
            try {
              controller.enqueue(chunk);
            } catch {
              isClosed = true;
              fileStream.destroy();
            }
          }
        });
        fileStream.on("end", () => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch {}
          }
        });
        fileStream.on("error", (err) => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.error(err);
            } catch {}
          }
        });
      },
      cancel() {
        isClosed = true;
        fileStream.destroy();
      },
    });

    return new NextResponse(stream, {
      headers: {
        ...commonHeaders,
        "Content-Length": fileSize.toString(),
      },
    });
  }
}
