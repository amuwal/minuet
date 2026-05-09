import { NextResponse } from "next/server";
import { gijirokuToDocxBuffer } from "@/lib/docx";
import { gijirokuToMarkdown, gijirokuToPlainText } from "@/lib/markdown";
import type { Gijiroku } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type Format = "md" | "txt" | "docx";

type Body = {
  gijiroku?: Gijiroku;
  format?: Format;
};

function safeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80) || "gijiroku";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const g = body.gijiroku;
    const format = body.format ?? "md";

    if (!g) {
      return NextResponse.json({ error: "gijiroku is required" }, { status: 400 });
    }

    const baseName = safeFilename(g.会議名 || "gijiroku");

    if (format === "md") {
      const md = gijirokuToMarkdown(g);
      return new NextResponse(md, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(baseName)}.md`,
        },
      });
    }

    if (format === "txt") {
      const txt = gijirokuToPlainText(g);
      return new NextResponse(txt, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(baseName)}.txt`,
        },
      });
    }

    if (format === "docx") {
      const buf = await gijirokuToDocxBuffer(g);
      const body = new Uint8Array(buf);
      return new NextResponse(body, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(baseName)}.docx`,
        },
      });
    }

    return NextResponse.json({ error: `unsupported format: ${format}` }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
