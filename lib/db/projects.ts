import { dbDelete, dbGet, dbGetAll, dbPut, newId } from "./client";
import { STORE_PROJECTS, type ProjectRecord } from "./schema";

type SaveInput = Omit<ProjectRecord, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export async function listProjects(): Promise<ProjectRecord[]> {
  const all = await dbGetAll<ProjectRecord>(STORE_PROJECTS);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
  return dbGet<ProjectRecord>(STORE_PROJECTS, id);
}

export async function saveProject(input: SaveInput): Promise<ProjectRecord> {
  const now = Date.now();
  const existing = input.id ? await getProject(input.id) : undefined;
  const record: ProjectRecord = {
    ...input,
    id: input.id ?? newId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await dbPut(STORE_PROJECTS, record);
  return record;
}

export async function deleteProject(id: string): Promise<void> {
  await dbDelete(STORE_PROJECTS, id);
}
