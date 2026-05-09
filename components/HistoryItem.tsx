"use client";

import Link from "next/link";
import Icon from "./Icon";
import type { MeetingRecord } from "@/lib/db";

type Props = {
  meeting: MeetingRecord;
  onDelete: (id: string) => void;
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}日前`;
  return formatDate(ts);
}

export default function HistoryItem({ meeting, onDelete }: Props) {
  const decisions = meeting.gijiroku.決定事項?.length ?? 0;
  const todos = meeting.gijiroku.ToDo?.length ?? 0;
  const attendees = meeting.gijiroku.出席者?.length ?? 0;

  return (
    <div className="history-item">
      <Link href={`/meetings/${meeting.id}`} className="history-item-main">
        <div className="history-item-title">{meeting.title || "(無題の会議)"}</div>
        <div className="history-item-meta">
          {meeting.datetime && (
            <>
              <span className="mono">{meeting.datetime}</span>
              <span className="dot-sep" />
            </>
          )}
          <span>{formatRelative(meeting.createdAt)}</span>
        </div>
        <div className="history-item-stats">
          <span className="hi-stat">
            <b>{decisions}</b> 決定事項
          </span>
          <span className="hi-stat">
            <b>{todos}</b> ToDo
          </span>
          <span className="hi-stat">
            <b>{attendees}</b> 出席者
          </span>
          {meeting.hasAudio && <span className="hi-stat hi-audio">音声あり</span>}
        </div>
      </Link>
      <button
        className="history-item-delete"
        onClick={() => onDelete(meeting.id)}
        title="削除"
        aria-label="削除"
        type="button"
      >
        <Icon name="trash" size={14} />
      </button>
    </div>
  );
}
