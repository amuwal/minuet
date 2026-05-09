import { runFfmpeg } from "./ffmpeg";

export const TARGET_CHUNK_SEC = 10 * 60;
export const MAX_CHUNK_SEC = 15 * 60;
export const MIN_CHUNK_SEC = 2 * 60;
const SILENCE_NOISE_DB = -30;
const SILENCE_MIN_DUR = 0.5;

export type SilenceRegion = { start: number; end: number };

export async function detectSilences(
  inputPath: string,
  noiseDb = SILENCE_NOISE_DB,
  minDurSec = SILENCE_MIN_DUR
): Promise<SilenceRegion[]> {
  const { stderr } = await runFfmpeg([
    "-i",
    inputPath,
    "-af",
    `silencedetect=noise=${noiseDb}dB:d=${minDurSec}`,
    "-f",
    "null",
    "-",
  ]);

  const startRe = /silence_start:\s*(\d+(?:\.\d+)?)/g;
  const endRe = /silence_end:\s*(\d+(?:\.\d+)?)\s*\|\s*silence_duration:\s*(\d+(?:\.\d+)?)/g;

  const starts: number[] = [];
  const ends: number[] = [];
  let m;
  while ((m = startRe.exec(stderr))) starts.push(Number(m[1]));
  while ((m = endRe.exec(stderr))) ends.push(Number(m[1]));

  const regions: SilenceRegion[] = [];
  for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
    regions.push({ start: starts[i], end: ends[i] });
  }
  return regions;
}

export function pickSplitPoints(
  durationSec: number,
  silences: SilenceRegion[],
  targetChunkSec = TARGET_CHUNK_SEC,
  maxChunkSec = MAX_CHUNK_SEC,
  minChunkSec = MIN_CHUNK_SEC
): number[] {
  const splits: number[] = [];
  let cursor = 0;

  while (durationSec - cursor > maxChunkSec) {
    const target = cursor + targetChunkSec;
    const hardLimit = cursor + maxChunkSec;
    const softFloor = cursor + minChunkSec;

    const candidates = silences
      .filter((s) => {
        const mid = (s.start + s.end) / 2;
        return mid >= softFloor && mid <= hardLimit;
      })
      .map((s) => ({ mid: (s.start + s.end) / 2 }))
      .sort((a, b) => Math.abs(a.mid - target) - Math.abs(b.mid - target));

    const cut = candidates[0]?.mid ?? hardLimit;
    splits.push(cut);
    cursor = cut;
  }

  return splits;
}
