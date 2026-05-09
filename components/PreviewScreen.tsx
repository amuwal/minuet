"use client";

import { useState } from "react";
import GijirokuDoc from "./gijiroku-doc";
import Icon from "./Icon";
import TranscriptSidebar from "./TranscriptSidebar";
import { gijirokuToMarkdown } from "@/lib/markdown";
import type { Gijiroku, Transcript } from "@/lib/types";
import type { PreviewLayout } from "@/hooks/use-theme";

type Props = {
  gijiroku: Gijiroku;
  onChange: (next: Gijiroku) => void;
  transcript: Transcript;
  audioUrl: string | null;
  layout: PreviewLayout;
  onLayoutChange: (next: PreviewLayout) => void;
  onExport: () => void;
  breadcrumb?: React.ReactNode;
};

function charCount(g: Gijiroku): number {
  return gijirokuToMarkdown(g).length;
}

export default function PreviewScreen({
  gijiroku,
  onChange,
  transcript,
  audioUrl,
  layout,
  onLayoutChange,
  onExport,
  breadcrumb,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(gijirokuToMarkdown(gijiroku));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className={"canvas-inner " + (layout === "split" ? "split" : "wide")}>
      {breadcrumb}
      <div className="doc-toolbar">
        <div className="meta">
          <span className="dot" /> <b>議事録</b> <span>·</span>
          <span className="mono">{charCount(gijiroku).toLocaleString()}文字</span>
          <span>·</span>
          <span>{transcript.chunks.length} チャンクから構成</span>
        </div>
        <div className="actions">
          <button
            className="btn btn-sm"
            data-active={layout === "split" ? "" : undefined}
            onClick={() => onLayoutChange(layout === "split" ? "single" : "split")}
            type="button"
            title={layout === "split" ? "単一表示" : "分割表示"}
          >
            <Icon name="split" size={12} />
            {layout === "split" ? "単一" : "分割"}
          </button>
          <button className="btn btn-sm" onClick={copyAll} type="button">
            <Icon name="copy" size={12} />
            {copied ? "コピー済み" : "コピー"}
          </button>
          <button
            className="btn btn-sm"
            data-active={editMode || undefined}
            onClick={() => setEditMode(!editMode)}
            type="button"
          >
            <Icon name="edit" size={12} />
            {editMode ? "編集を終了" : "編集モード"}
          </button>
          <button className="btn btn-sm btn-primary" onClick={onExport} type="button">
            <Icon name="download" size={12} />
            エクスポート
          </button>
        </div>
      </div>

      <div
        className="gj-shell"
        style={layout === "split" ? { gridTemplateColumns: "360px 1fr" } : undefined}
      >
        {layout === "split" && (
          <TranscriptSidebar transcript={transcript} audioUrl={audioUrl} />
        )}
        <GijirokuDoc gijiroku={gijiroku} onChange={onChange} editing={editMode} />
      </div>

      {editMode && (
        <div className="toast">
          <Icon name="edit" size={13} />
          編集モード — 任意の項目をクリックで編集できます
        </div>
      )}
    </div>
  );
}
