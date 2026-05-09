"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import Waveform from "./Waveform";
import { ACCEPTED_AUDIO_MIME } from "@/lib/constants";

export type UploadedFile = {
  file: File;
  url: string;
  durationSec: number | null;
};

type Props = {
  uploaded: UploadedFile | null;
  onSelect: (f: UploadedFile | null) => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDuration(sec: number | null): string {
  if (sec === null || !isFinite(sec)) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function estimateChunks(durationSec: number | null): number {
  if (!durationSec) return 1;
  return Math.max(1, Math.ceil(durationSec / 600));
}

function estimateCostYen(durationSec: number | null): number {
  if (!durationSec) return 0;
  const minutes = durationSec / 60;
  return Math.ceil(minutes * 1.25 + 40);
}

function estimateProcessingMinutes(durationSec: number | null): string {
  if (!durationSec) return "—";
  const m = durationSec / 60;
  if (m <= 30) return "1〜2分";
  if (m <= 60) return "2〜3分";
  if (m <= 90) return "3〜4分";
  return "4〜6分";
}

async function probeDuration(file: File, url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = url;
    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", onLoad);
      audio.removeEventListener("error", onErr);
    };
    const onLoad = () => {
      cleanup();
      resolve(isFinite(audio.duration) ? audio.duration : null);
    };
    const onErr = () => {
      cleanup();
      resolve(null);
    };
    audio.addEventListener("loadedmetadata", onLoad);
    audio.addEventListener("error", onErr);
  });
}

export default function UploadScreen({ uploaded, onSelect }: Props) {
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (uploaded) URL.revokeObjectURL(uploaded.url);
    };
  }, [uploaded]);

  async function handleFile(file: File) {
    if (uploaded) URL.revokeObjectURL(uploaded.url);
    const url = URL.createObjectURL(file);
    const durationSec = await probeDuration(file, url);
    onSelect({ file, url, durationSec });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setHover(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  }

  return (
    <div className="canvas-inner">
      <p className="eyebrow">Step 01 — 音声ファイルのアップロード</p>
      <h1 className="h1">会議の音声ファイルを選択してください</h1>
      <p className="lede">
        最大 約2時間の録音に対応。サーバー側で 16kHz mono に変換し、無音区間を検出して
        分割してから Whisper API で並列処理を行います。
      </p>

      {!uploaded ? (
        <div
          className="dropzone"
          data-hover={hover ? "" : undefined}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onDragOver={(e) => {
            e.preventDefault();
            setHover(true);
          }}
          onDragLeave={() => setHover(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <div className="ico">
            <Icon name="upload" size={22} />
          </div>
          <h3>ここに音声ファイルをドロップ</h3>
          <div className="muted jp" style={{ fontSize: 12.5 }}>
            またはクリックしてファイルを選択
          </div>
          <div className="formats">
            <span>MP3</span>·<span>M4A</span>·<span>WAV</span>·<span>MP4</span>·
            <span>MOV</span>·<span>WEBM</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_AUDIO_MIME}
            style={{ display: "none" }}
            onChange={onChange}
          />
        </div>
      ) : (
        <>
          <div className="filerow">
            <div className="ico">
              <Icon name="audio" size={18} />
            </div>
            <div className="meta">
              <div className="name">{uploaded.file.name}</div>
              <div className="sub">
                {formatBytes(uploaded.file.size)} · {formatDuration(uploaded.durationSec)}
                {" · "}
                サーバーで mono 16kHz mp3 に正規化
              </div>
            </div>
            <Waveform />
            <button
              className="x"
              onClick={() => {
                URL.revokeObjectURL(uploaded.url);
                onSelect(null);
              }}
              title="削除"
              type="button"
            >
              <Icon name="x" />
            </button>
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="tag">
              {estimateChunks(uploaded.durationSec)} チャンクに分割予定
            </span>
            <span className="tag">推定処理時間 {estimateProcessingMinutes(uploaded.durationSec)}</span>
            <span className="tag">推定 ¥{estimateCostYen(uploaded.durationSec)} / 1回</span>
          </div>
        </>
      )}
    </div>
  );
}
