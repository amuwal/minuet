import type { ContextFormState } from "@/lib/defaults";
import type { Gijiroku, Transcript } from "@/lib/types";

export type ProjectRecord = {
  id: string;
  name: string;
  attendees: string;
  terms: string;
  place?: string;
  author?: string;
  createdAt: number;
  updatedAt: number;
};

export type MeetingRecord = {
  id: string;
  projectId?: string;
  title: string;
  datetime: string;
  gijiroku: Gijiroku;
  transcript: Transcript;
  contextSnapshot: ContextFormState;
  audioFilename?: string;
  hasAudio: boolean;
  createdAt: number;
  updatedAt: number;
};

export type AudioRecord = {
  meetingId: string;
  blob: Blob;
  filename: string;
};

export const STORE_MEETINGS = "meetings";
export const STORE_AUDIO = "audio";
export const STORE_PROJECTS = "projects";

export type StoreName =
  | typeof STORE_MEETINGS
  | typeof STORE_AUDIO
  | typeof STORE_PROJECTS;
