import path from "node:path";
import {
  type Chunk,
  fileSizeBytes,
  normalizeToMp3,
  probeDurationSec,
  sliceChunks,
} from "./ffmpeg";
import { MAX_CHUNK_SEC, detectSilences, pickSplitPoints } from "./silence";

export type { Chunk } from "./ffmpeg";
export type { SilenceRegion } from "./silence";
export type { WorkDir } from "./workdir";
export { createWorkDir } from "./workdir";
export { fileSizeBytes, probeDurationSec } from "./ffmpeg";

const WHISPER_SIZE_LIMIT_BYTES = 24 * 1024 * 1024;

export async function prepareAndChunk(
  inputPath: string,
  workDir: string
): Promise<{ normalizedPath: string; durationSec: number; chunks: Chunk[] }> {
  const normalizedPath = path.join(workDir, "normalized.mp3");
  await normalizeToMp3(inputPath, normalizedPath);

  const durationSec = await probeDurationSec(normalizedPath);
  const sizeBytes = await fileSizeBytes(normalizedPath);

  if (sizeBytes <= WHISPER_SIZE_LIMIT_BYTES && durationSec <= MAX_CHUNK_SEC) {
    return {
      normalizedPath,
      durationSec,
      chunks: [{ index: 0, path: normalizedPath, startSec: 0, endSec: durationSec }],
    };
  }

  const silences = await detectSilences(normalizedPath);
  const splits = pickSplitPoints(durationSec, silences);
  const chunks = await sliceChunks(normalizedPath, splits, durationSec, workDir);

  return { normalizedPath, durationSec, chunks };
}
