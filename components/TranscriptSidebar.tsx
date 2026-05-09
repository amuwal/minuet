"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import type { Transcript } from "@/lib/types";

type Props = {
  transcript: Transcript;
  audioUrl: string | null;
};

function fmtTimestamp(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TranscriptSidebar({ transcript, audioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentSec(audio.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [audioUrl]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play().catch(() => {});
  }

  function seekTo(sec: number) {
    const audio = audioRef.current;
    if (!audio) {
      setCurrentSec(sec);
      return;
    }
    audio.currentTime = sec;
    setCurrentSec(sec);
  }

  const segments = transcript.chunks.flatMap((c) => c.segments);

  return (
    <aside className="gj-side">
      <div className="gj-side-h">
        <b>文字起こし</b>
        <div className="player">
          <button
            className="btn btn-icon btn-sm"
            onClick={toggle}
            title={playing ? "停止" : "再生"}
            disabled={!audioUrl}
            type="button"
          >
            <Icon name={playing ? "pause" : "play"} size={11} />
          </button>
          <span>
            {fmtTimestamp(currentSec)} / {fmtTimestamp(transcript.durationSec)}
          </span>
        </div>
      </div>
      <div className="gj-side-body">
        {segments.map((seg, i) => {
          const isCurrent = currentSec >= seg.start && currentSec < seg.end;
          return (
            <div
              key={i}
              className={"tx-line" + (isCurrent ? " cur" : "")}
              onClick={() => seekTo(seg.start)}
            >
              <span className="ts">{fmtTimestamp(seg.start)}</span>
              <div>
                <span className="txt">{seg.text}</span>
              </div>
            </div>
          );
        })}
        {segments.length === 0 && (
          <div style={{ color: "var(--faint)", fontSize: 12, textAlign: "center", padding: 16 }}>
            セグメントがありません
          </div>
        )}
      </div>
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}
    </aside>
  );
}
