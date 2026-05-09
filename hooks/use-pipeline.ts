"use client";

import { useCallback, useRef, useState } from "react";
import type { PhaseId } from "@/lib/constants";
import type { LogLevel, PipelineEvent } from "@/lib/events";
import type { Gijiroku, MeetingContext, Transcript } from "@/lib/types";

export type LogEntry = { ts: string; lvl: LogLevel; msg: string };

export type PipelineState = {
  status: "idle" | "running" | "done" | "error";
  phase: PhaseId | null;
  progress: number;
  logs: LogEntry[];
  result: { gijiroku: Gijiroku; transcript: Transcript } | null;
  error: string | null;
};

const INITIAL: PipelineState = {
  status: "idle",
  phase: null,
  progress: 0,
  logs: [],
  result: null,
  error: null,
};

export function usePipeline() {
  const [state, setState] = useState<PipelineState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(INITIAL);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((prev) => ({ ...prev, status: "idle" }));
  }, []);

  const run = useCallback(async (audio: File, context: MeetingContext) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState({ ...INITIAL, status: "running" });

    const fd = new FormData();
    fd.append("audio", audio);
    fd.append("context", JSON.stringify(context));

    let res: Response;
    try {
      res = await fetch("/api/process", {
        method: "POST",
        body: fd,
        signal: ctrl.signal,
      });
    } catch (err) {
      if (ctrl.signal.aborted) return;
      const msg = err instanceof Error ? err.message : String(err);
      setState((p) => ({ ...p, status: "error", error: msg }));
      return;
    }

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      setState((p) => ({ ...p, status: "error", error: text || `HTTP ${res.status}` }));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          let evt: PipelineEvent;
          try {
            evt = JSON.parse(line) as PipelineEvent;
          } catch {
            continue;
          }
          handleEvent(evt, setState);
        }
      }
    } catch (err) {
      if (ctrl.signal.aborted) return;
      const msg = err instanceof Error ? err.message : String(err);
      setState((p) => ({ ...p, status: "error", error: msg }));
    }
  }, []);

  return { state, run, cancel, reset };
}

function handleEvent(evt: PipelineEvent, setState: React.Dispatch<React.SetStateAction<PipelineState>>) {
  switch (evt.type) {
    case "phase":
      setState((p) => ({ ...p, phase: evt.phase }));
      return;
    case "progress":
      setState((p) => ({ ...p, progress: Math.max(p.progress, evt.pct) }));
      return;
    case "log":
      setState((p) => ({ ...p, logs: [...p.logs, { ts: evt.ts, lvl: evt.lvl, msg: evt.msg }] }));
      return;
    case "result":
      setState((p) => ({
        ...p,
        status: "done",
        progress: 100,
        result: { gijiroku: evt.gijiroku, transcript: evt.transcript },
      }));
      return;
    case "error":
      setState((p) => ({ ...p, status: "error", error: evt.error }));
      return;
  }
}
