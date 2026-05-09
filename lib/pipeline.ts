import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createWorkDir, prepareAndChunk, fileSizeBytes } from "@/lib/audio";
import { generateGijiroku } from "@/lib/claude";
import { PHASE_RANGES } from "@/lib/constants";
import type { Emit } from "@/lib/events";
import { nowJpTimestamp } from "@/lib/parse";
import type { Gijiroku, MeetingContext, Transcript } from "@/lib/types";
import { transcribeChunks } from "@/lib/whisper";

export type PipelineInput = {
  audioBuffer: Buffer;
  audioFilename: string;
  context: MeetingContext;
};

export type PipelineResult = {
  gijiroku: Gijiroku;
  transcript: Transcript;
};

function fmtMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * Math.max(0, Math.min(1, t));
}

export async function runPipeline(
  input: PipelineInput,
  emit: Emit
): Promise<PipelineResult> {
  const work = await createWorkDir();
  const log = (lvl: "info" | "ok" | "warn" | "error", msg: string) =>
    emit({ type: "log", ts: nowJpTimestamp(), lvl, msg });

  try {
    emit({ type: "phase", phase: "chunk" });
    emit({ type: "progress", pct: PHASE_RANGES.chunk.from });

    const ext = path.extname(input.audioFilename) || ".bin";
    const inputPath = path.join(work.dir, `input${ext}`);
    await writeFile(inputPath, input.audioBuffer);

    log("info", `input: ${input.audioFilename} (${fmtMb(input.audioBuffer.length)})`);
    log("info", "ffmpeg: 16kHz mono mp3 96kbps へ正規化中…");

    const { normalizedPath, durationSec, chunks } = await prepareAndChunk(
      inputPath,
      work.dir
    );
    const normSize = await fileSizeBytes(normalizedPath);

    log(
      "ok",
      `正規化完了: ${fmtMb(input.audioBuffer.length)} → ${fmtMb(normSize)} · 長さ ${(durationSec / 60).toFixed(1)}分`
    );
    log("ok", `${chunks.length} チャンクに分割（無音検出ベース）`);
    emit({ type: "progress", pct: PHASE_RANGES.chunk.to });

    emit({ type: "phase", phase: "stt" });
    const termCount = input.context.用語辞書?.length ?? 0;
    log("info", `Whisper API: ${chunks.length} 件並列実行 · 用語辞書 ${termCount} 件適用`);

    const transcript = await transcribeChunks(chunks, input.context.用語辞書 ?? [], {
      concurrency: 4,
      onChunkComplete: ({ completed, total, chunk }) => {
        const pct = lerp(PHASE_RANGES.stt.from, PHASE_RANGES.stt.to, completed / total);
        emit({ type: "progress", pct });
        log(
          "info",
          `chunk ${chunk.index + 1}/${total}: ${chunk.text.length} 文字 (${completed}/${total} 完了)`
        );
      },
    });

    log("ok", `文字起こし合計: ${transcript.fullText.length} 文字`);
    emit({ type: "progress", pct: PHASE_RANGES.stt.to });

    emit({ type: "phase", phase: "summarize" });
    log("info", "Claude: tool=create_gijiroku で構造化");

    const gijiroku = await generateGijiroku(transcript.fullText, input.context);

    log(
      "ok",
      `構造化完了: 決定事項 ${gijiroku.決定事項.length} 件 · ToDo ${gijiroku.ToDo.length} 件`
    );
    emit({ type: "progress", pct: PHASE_RANGES.summarize.to });

    emit({ type: "phase", phase: "format" });
    log("info", "後処理: 5W2H・西暦・話者表記の最終チェック");
    emit({ type: "progress", pct: PHASE_RANGES.format.to });
    log("ok", "議事録の生成が完了しました");

    return { gijiroku, transcript };
  } finally {
    await work.cleanup().catch(() => {});
  }
}
