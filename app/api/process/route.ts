import { NextRequest, NextResponse } from "next/server";
import { verifyCreateAuth } from "@/lib/auth";
import { encodeEvent, makeEmitter } from "@/lib/events";
import { runPipeline } from "@/lib/pipeline";
import type { MeetingContext } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!verifyCreateAuth(req)) {
    return NextResponse.json(
      { error: "認証が必要です。パスワードを入力してください。" },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const audio = formData.get("audio");
  const ctxRaw = formData.get("context");

  if (!(audio instanceof File)) {
    return new Response(JSON.stringify({ error: "audio file is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let context: MeetingContext = {};
  if (typeof ctxRaw === "string" && ctxRaw.trim()) {
    try {
      context = JSON.parse(ctxRaw) as MeetingContext;
    } catch {
      return new Response(JSON.stringify({ error: "context must be JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = makeEmitter(controller);
      try {
        const { gijiroku, transcript } = await runPipeline(
          { audioFile: audio, context },
          emit
        );
        emit({ type: "result", gijiroku, transcript, context });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encodeEvent({ type: "error", error: msg }));
      } finally {
        controller.close();
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
