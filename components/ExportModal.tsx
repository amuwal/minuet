"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { EXPORT_FORMATS, type ExportFormatId } from "@/lib/constants";
import type { Gijiroku } from "@/lib/types";

type Props = {
  gijiroku: Gijiroku;
  onClose: () => void;
};

function safeFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "gijiroku";
}

function isoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function downloadServerFormat(
  gijiroku: Gijiroku,
  format: "md" | "txt" | "docx",
  filename: string
) {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gijiroku, format }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "export failed" }));
    throw new Error(err.error ?? "export failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPdfViaPrint() {
  window.print();
}

export default function ExportModal({ gijiroku, onClose }: Props) {
  const [sel, setSel] = useState<ExportFormatId>("docx");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const filename = `gijiroku_${isoDate()}_${safeFilename(gijiroku.会議名 || "meeting")}`;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleDownload() {
    setErr(null);
    try {
      if (sel === "pdf") {
        downloadPdfViaPrint();
      } else {
        await downloadServerFormat(gijiroku, sel, filename);
      }
      setDone(true);
      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <h3>議事録をエクスポート</h3>
          <div className="sub">出力形式を選択してください</div>
        </div>
        <div className="modal-body">
          <div className="export-opts">
            {EXPORT_FORMATS.map((o) => (
              <button
                key={o.id}
                className="export-opt"
                data-selected={sel === o.id || undefined}
                onClick={() => setSel(o.id)}
                type="button"
              >
                <div className="x-ico">{o.ext}</div>
                <div className="meta">
                  <div className="t">{o.title}</div>
                  <div className="d">{o.desc}</div>
                </div>
                {sel === o.id && <Icon name="check" size={14} />}
              </button>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: "var(--surface-2)",
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            <span className="jp muted">ファイル名</span>
            <span className="mono" style={{ color: "var(--ink)" }}>
              {filename}.{sel}
            </span>
          </div>
          {err && (
            <div style={{ marginTop: 10, color: "var(--warn)", fontSize: 12 }}>{err}</div>
          )}
        </div>
        <div className="modal-foot">
          <span className="note">メールで直接送信する場合は v2 にて対応予定</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={onClose} type="button">
              キャンセル
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleDownload} type="button">
              {done ? (
                <>
                  <Icon name="check" size={12} /> 完了
                </>
              ) : (
                <>
                  <Icon name="download" size={12} /> ダウンロード
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
