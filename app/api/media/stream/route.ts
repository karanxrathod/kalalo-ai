import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { validateMediaServingPath } from "@/src/utils/paths";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePathParam = searchParams.get("path");

    if (!filePathParam) {
      return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
    }

    const resolved = validateMediaServingPath(filePathParam);
    const stats = fs.statSync(resolved);
    const fileSize = stats.size;

    const range = request.headers.get("range");
    const isDownload = searchParams.get("download") === "true";
    const downloadFilename = searchParams.get("filename") || path.basename(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const contentType = ext === ".srt" 
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
