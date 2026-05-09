import { createReadStream } from "node:fs";
import OpenAI from "openai";
import type { Chunk } from "./audio";
import type { Transcript, TranscriptChunk, TranscriptSegment } from "./types";

const PROMPT_CHAR_BUDGET = 800;
const PREV_TAIL_CHARS = 200;
const WHISPER_MODEL = process.env.WHISPER_MODEL || "whisper-1";

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export function buildPrompt(termDictionary: string[], previousTail: string): string {
  const tail = previousTail.slice(-PREV_TAIL_CHARS).trim();

  const sortedTerms = [...new Set(termDictionary.map((t) => t.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length
  );

  const parts: string[] = [];
  let used = tail.length;
  if (tail) parts.push(tail);

  for (const term of sortedTerms) {
    const cost = term.length + 1;
    if (used + cost > PROMPT_CHAR_BUDGET) break;
    parts.push(term);
    used += cost;
  }

  return parts.join("、");
}

type WhisperVerboseResponse = {
  text: string;
  segments?: Array<{ start: number; end: number; text: string }>;
  duration?: number;
};

export async function transcribeChunk(
  chunkPath: string,
  prompt: string
): Promise<WhisperVerboseResponse> {
  const file = createReadStream(chunkPath);
  const res = (await client().audio.transcriptions.create({
    file,
    model: WHISPER_MODEL,
    language: "ja",
    response_format: "verbose_json",
    prompt: prompt || undefined,
  })) as unknown as WhisperVerboseResponse;
  return res;
}

export type TranscribeOptions = {
  concurrency?: number;
  onChunkComplete?: (info: { completed: number; total: number; chunk: TranscriptChunk }) => void;
};

export async function transcribeChunks(
  chunks: Chunk[],
  termDictionary: string[],
  options: TranscribeOptions = {}
): Promise<Transcript> {
  const concurrency = options.concurrency ?? 4;
  const total = chunks.length;
  const results: TranscriptChunk[] = new Array(total);
  const tails: string[] = new Array(total).fill("");
  let completed = 0;

  for (let i = 0; i < total; i += concurrency) {
    const batch = chunks.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (chunk) => {
        const prevTail = chunk.index > 0 ? tails[chunk.index - 1] : "";
        const prompt = buildPrompt(termDictionary, prevTail);

        const res = await transcribeChunk(chunk.path, prompt);
        const segments: TranscriptSegment[] = (res.segments ?? []).map((s) => ({
          start: s.start + chunk.startSec,
          end: s.end + chunk.startSec,
          text: s.text,
        }));

        return {
          index: chunk.index,
          startSec: chunk.startSec,
          endSec: chunk.endSec,
          text: res.text,
          segments,
        } satisfies TranscriptChunk;
      })
    );

    for (const tc of batchResults) {
      results[tc.index] = tc;
      tails[tc.index] = tc.text.slice(-PREV_TAIL_CHARS);
      completed += 1;
      options.onChunkComplete?.({ completed, total, chunk: tc });
    }
  }

  const sorted = results.filter(Boolean).sort((a, b) => a.index - b.index);
  const fullText = sorted.map((c) => c.text).join("\n");
  const durationSec = sorted.length ? sorted[sorted.length - 1].endSec : 0;

  return { fullText, chunks: sorted, durationSec };
}
