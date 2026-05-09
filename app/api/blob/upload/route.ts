import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { verifyCreateAuth } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 500 * 1024 * 1024;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob storage not configured (BLOB_READ_WRITE_TOKEN missing)" },
      { status: 500 }
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です" }, { status: 400 });
  }

  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!verifyCreateAuth(req)) {
          throw new Error("認証が必要です。パスワードを入力してください。");
        }
        return {
          allowedContentTypes: [
            "audio/mpeg",
            "audio/mp4",
            "audio/wav",
            "audio/x-wav",
            "audio/webm",
            "audio/ogg",
            "audio/flac",
            "audio/m4a",
            "audio/x-m4a",
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "application/octet-stream",
          ],
          maximumSizeInBytes: MAX_AUDIO_BYTES,
        };
      },
      onUploadCompleted: async () => {
        /* no-op: server-side post-upload hook */
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "アップロードに失敗しました";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
