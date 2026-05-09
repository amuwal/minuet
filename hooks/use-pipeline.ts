"use client";

import { upload } from "@vercel/blob/client";
import { useCallback, useRef, useState } from "react";
import type { PhaseId } from "@/lib/constants";
import type { LogLevel, PipelineEvent } from "@/lib/events";
import { nowJpTimestamp } from "@/lib/parse";
import type { Gijiroku, MeetingContext, Transcript } from "@/lib/types";

export type LogEntry = { ts: string; lvl: LogLevel; msg: string };

export type PipelineState = {
  status: "idle" | "uploading" | "running" | "done" | "error";
  phase: PhaseId | null;
  progress: number;
  logs: LogEntry[];
  result: { gijiroku: Gijiroku; transcript: Transcript } | null;
  error: string | null;
  uploadPct: number;
};

const INITIAL: PipelineState = {
  status: "idle",
  phase: null,
  progress: 0,
  logs: [],
  result: null,
  error: null,
  uploadPct: 0,
};

function fmtMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
}

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

    setState({
      ...INITIAL,
      status: "uploading",
      logs: [
        {
          ts: nowJpTimestamp(),
          lvl: "info",
          msg: `Vercel Blob: ${audio.name} (${fmtMb(audio.size)}) をアップロード中…`,
        },
      ],
    });

    const ext = audio.name.match(/\.[^.]+$/)?.[0]?.toLowerCase() ?? "";
    const safePath = `audio-${
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2)
    }${ext}`;

    let blobUrl: string;
    try {
      const res = await upload(safePath, audio, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        onUploadProgress: (p) => {
          setState((s) => ({ ...s, uploadPct: Math.round(p.percentage) }));
        },
      });
      blobUrl = res.url;
    } catch (err) {
      if (ctrl.signal.aborted) return;
      const msg = err instanceof Error ? err.message : String(err);
      setState((p) => ({ ...p, status: "error", error: `アップロードに失敗しました: ${msg}` }));
      return;
    }

    setState((p) => ({
      ...p,
      status: "running",
      uploadPct: 100,
      logs: [
        ...p.logs,
        {
          ts: nowJpTimestamp(),
          lvl: "ok",
          msg: "アップロード完了 — 文字起こしを開始します",
        },
      ],
    }));

    let res: Response;
    try {
      res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl, fileName: audio.name, context }),
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

function handleEvent(
  evt: PipelineEvent,
  setState: React.Dispatch<React.SetStateAction<PipelineState>>
) {
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
