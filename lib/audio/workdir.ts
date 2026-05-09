import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export type WorkDir = {
  dir: string;
  cleanup: () => Promise<void>;
};

export async function createWorkDir(prefix = "minuet-"): Promise<WorkDir> {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  return {
    dir,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}
