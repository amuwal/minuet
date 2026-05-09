import { dbDelete, dbGet, dbGetAll, dbPut, newId } from "./client";
import { STORE_AUDIO, STORE_MEETINGS, type MeetingRecord } from "./schema";

type SaveInput = Omit<MeetingRecord, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export async function listMeetings(): Promise<MeetingRecord[]> {
  const all = await dbGetAll<MeetingRecord>(STORE_MEETINGS);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMeeting(id: string): Promise<MeetingRecord | undefined> {
  return dbGet<MeetingRecord>(STORE_MEETINGS, id);
}

export async function saveMeeting(input: SaveInput): Promise<MeetingRecord> {
  const now = Date.now();
  const existing = input.id ? await getMeeting(input.id) : undefined;
  const record: MeetingRecord = {
    ...input,
    id: input.id ?? newId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await dbPut(STORE_MEETINGS, record);
  return record;
}

export async function deleteMeeting(id: string): Promise<void> {
  await dbDelete(STORE_MEETINGS, id);
  await dbDelete(STORE_AUDIO, id).catch(() => {});
}
