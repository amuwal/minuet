import { dbDelete, dbGet, dbPut } from "./client";
import { STORE_AUDIO, type AudioRecord } from "./schema";

export async function getAudio(meetingId: string): Promise<AudioRecord | undefined> {
  return dbGet<AudioRecord>(STORE_AUDIO, meetingId);
}

export async function saveAudio(
  meetingId: string,
  blob: Blob,
  filename: string
): Promise<void> {
  await dbPut<AudioRecord>(STORE_AUDIO, { meetingId, blob, filename });
}

export async function deleteAudio(meetingId: string): Promise<void> {
  await dbDelete(STORE_AUDIO, meetingId);
}
