import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { verifyCreateAuth } from "@/lib/auth";
import { encodeEvent, makeEmitter } from "@/lib/events";
import { runPipeline } from "@/lib/pipeline";
import type { MeetingContext } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  blobUrl?: string;
  fileName?: string;
  context?: MeetingContext;
};

export async function POST(req: NextRequest) {
  if (!verifyCreateAuth(req)) {
    return NextResponse.json(
      { error: "認証が必要です。パスワードを入力してください。" },
      { status: 401 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { blobUrl, fileName, context } = body;
  if (!blobUrl) {
    return NextResponse.json({ error: "blobUrl is required" }, { status: 400 });
  }

  let audioBuffer: Buffer;
  try {
    const audioRes = await fetch(blobUrl);
    if (!audioRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch blob (HTTP ${audioRes.status})` },
        { status: 400 }
      );
    }
    audioBuffer = Buffer.from(await audioRes.arrayBuffer());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Blob fetch failed: ${msg}` }, { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = makeEmitter(controller);
      try {
        const { gijiroku, transcript } = await runPipeline(
          {
            audioBuffer,
            audioFilename: fileName ?? "input.bin",
            context: context ?? {},
          },
          emit
        );
        emit({ type: "result", gijiroku, transcript, context: context ?? {} });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encodeEvent({ type: "error", error: msg }));
      } finally {
        controller.close();
        del(blobUrl).catch(() => {
          /* best-effort cleanup */
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
