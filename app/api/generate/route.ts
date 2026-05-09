import { NextRequest, NextResponse } from "next/server";
import { verifyCreateAuth } from "@/lib/auth";
import { generateGijiroku } from "@/lib/claude";
import type { MeetingContext } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = {
  transcript?: string;
  context?: MeetingContext;
};

export async function POST(req: NextRequest) {
  if (!verifyCreateAuth(req)) {
    return NextResponse.json(
      { error: "認証が必要です。パスワードを入力してください。" },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as Body;
    const transcript = body.transcript?.trim();

    if (!transcript) {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }

    const context: MeetingContext = body.context ?? {};
    const gijiroku = await generateGijiroku(transcript, context);

    return NextResponse.json({ gijiroku });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
