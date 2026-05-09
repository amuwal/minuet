import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";

const FFMPEG_BIN = (ffmpegStatic as unknown as string) || "ffmpeg";

export type Chunk = {
  index: number;
  path: string;
  startSec: number;
  endSec: number;
};

export function runFfmpeg(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_BIN, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`ffmpeg exited ${code}: ${stderr}`));
    });
  });
}

export async function normalizeToMp3(inputPath: string, outputPath: string): Promise<void> {
  await runFfmpeg([
    "-y",
    "-i",
    inputPath,
    "-ac",
    "1",
    "-ar",
    "16000",
    "-b:a",
    "96k",
    "-codec:a",
    "libmp3lame",
    outputPath,
  ]);
}

export async function probeDurationSec(filePath: string): Promise<number> {
  const { stderr } = await runFfmpeg(["-i", filePath, "-f", "null", "-"]).catch((e) => ({
    stdout: "",
    stderr: (e as Error).message,
  }));
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) throw new Error("Unable to determine audio duration");
  const [, h, m, s] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export async function fileSizeBytes(filePath: string): Promise<number> {
  const s = await stat(filePath);
  return s.size;
}

export async function sliceChunks(
  inputPath: string,
  splitPoints: number[],
  durationSec: number,
  workDir: string
): Promise<Chunk[]> {
  const boundaries = [0, ...splitPoints, durationSec];
  const chunks: Chunk[] = [];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    const out = path.join(workDir, `chunk_${String(i).padStart(3, "0")}.mp3`);

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-ss",
      start.toFixed(3),
      "-to",
      end.toFixed(3),
      "-c",
      "copy",
      out,
    ]);

    chunks.push({ index: i, path: out, startSec: start, endSec: end });
  }

  return chunks;
}
