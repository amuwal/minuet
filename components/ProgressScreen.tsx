"use client";

import { useEffect, useRef } from "react";
import Icon from "./Icon";
import { PHASES, type PhaseId } from "@/lib/constants";
import type { LogEntry } from "@/hooks/use-pipeline";

type Props = {
  phase: PhaseId | null;
  progress: number;
  logs: LogEntry[];
  error: string | null;
  onCancel: () => void;
  uploading?: boolean;
  uploadPct?: number;
};

function phaseIndex(phase: PhaseId | null): number {
  if (!phase) return 0;
  return PHASES.findIndex((p) => p.id === phase);
}

function etaSeconds(progress: number): number {
  const remaining = Math.max(0, 100 - progress);
  return Math.ceil((remaining / 100) * 240);
}

export default function ProgressScreen({
  phase,
  progress,
  logs,
  error,
  onCancel,
  uploading,
  uploadPct,
}: Props) {
  const idx = phaseIndex(phase);
  const logRef = useRef<HTMLDivElement>(null);
  const displayProgress = uploading ? Math.min(uploadPct ?? 0, 99) : progress;
  const displayLabel = error
    ? "エラー"
    : uploading
      ? "アップロード中…"
      : phase
        ? PHASES[idx].label
        : progress >= 100
          ? "完了"
          : "準備中";

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="canvas-inner" style={{ maxWidth: 720 }}>
      <p className="eyebrow">Step 03 — 議事録を生成中</p>
      <h1 className="h1">{error ? "エラーが発生しました" : "音声を解析しています…"}</h1>
      <p className="lede">
        {error
          ? "処理を中断しました。下記のログを確認してから再試行してください。"
          : "この処理にはおよそ 3〜4分 かかります。タブを閉じても処理は継続されます。"}
      </p>

      <div className="progress-card">
        <div className="row-spread" style={{ marginBottom: 6 }}>
          <span className="jp" style={{ fontWeight: 600, fontSize: 14 }}>
            {displayLabel}
          </span>
          <span className="progress-eta">
            {error
              ? "—"
              : uploading
                ? `${uploadPct ?? 0}%`
                : `ETA ${etaSeconds(progress)}s`}
          </span>
        </div>
        <div className="progress-bar">
          <i style={{ width: `${displayProgress}%` }} />
        </div>

        <div className="phases">
          {PHASES.map((p, i) => {
            const state = i < idx ? "done" : i === idx ? "active" : "pending";
            return (
              <div key={p.id} className="phase" data-state={state}>
                <div className="pico">
                  {state === "done" ? <Icon name="check" size={11} /> : i + 1}
                </div>
                <div className="ptitle">{p.label}</div>
                <div className="pdesc">{p.desc}</div>
                <div className="pmeta">{p.meta}</div>
              </div>
            );
          })}
        </div>

        <div className="log" ref={logRef}>
          {logs.map((l, i) => (
            <div key={i}>
              <span className="ts">{l.ts}</span>
              <span className={`lvl-${l.lvl}`}>[{l.lvl.toUpperCase()}]</span>{" "}
              <span>{l.msg}</span>
            </div>
          ))}
          {error && (
            <div>
              <span className="lvl-error" style={{ color: "var(--warn)" }}>
                [ERROR]
              </span>{" "}
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
        <button className="btn btn-ghost" onClick={onCancel} type="button">
          {error ? "戻る" : "キャンセル"}
        </button>
      </div>
    </div>
  );
}
