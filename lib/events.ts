import type { Gijiroku, MeetingContext, Transcript } from "./types";
import type { PhaseId } from "./constants";

export type LogLevel = "info" | "ok" | "warn" | "error";

export type PipelineEvent =
  | { type: "phase"; phase: PhaseId }
  | { type: "log"; ts: string; lvl: LogLevel; msg: string }
  | { type: "progress"; pct: number }
  | {
      type: "result";
      gijiroku: Gijiroku;
      transcript: Transcript;
      context: MeetingContext;
    }
  | { type: "error"; error: string };

export type Emit = (event: PipelineEvent) => void;

export function encodeEvent(event: PipelineEvent): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(event) + "\n");
}

export function makeEmitter(controller: ReadableStreamDefaultController): Emit {
  return (event) => {
    try {
      controller.enqueue(encodeEvent(event));
    } catch {
      /* controller closed — drop event */
    }
  };
}
