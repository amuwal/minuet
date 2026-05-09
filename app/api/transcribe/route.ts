import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { verifyCreateAuth } from "@/lib/auth";
import { createWorkDir, prepareAndChunk } from "@/lib/audio";
import { transcribeChunks } from "@/lib/whisper";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!verifyCreateAuth(req)) {
    return NextResponse.json(
      { error: "認証が必要です。パスワードを入力してください。" },
      { status: 401 }
    );
  }

  let cleanup: (() => Promise<void>) | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("audio");
    const termsRaw = formData.get("terms");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "audio file is required" }, { status: 400 });
    }

    const termDictionary: string[] =
      typeof termsRaw === "string" && termsRaw.trim()
        ? termsRaw
            .split(/\r?\n|,/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const work = await createWorkDir();
    cleanup = work.cleanup;

    const ext = path.extname(file.name) || ".bin";
    const inputPath = path.join(work.dir, `input${ext}`);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buf);

    const { durationSec, chunks } = await prepareAndChunk(inputPath, work.dir);
    const transcript = await transcribeChunks(chunks, termDictionary, { concurrency: 4 });

    return NextResponse.json({
      durationSec,
      chunkCount: chunks.length,
      transcript,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    if (cleanup) await cleanup().catch(() => {});
  }
}
