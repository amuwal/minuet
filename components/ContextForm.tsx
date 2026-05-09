"use client";

import { useMemo } from "react";
import Icon from "./Icon";
import ProjectPicker from "./ProjectPicker";
import type { ContextFormState } from "@/lib/defaults";
import type { ProjectRecord } from "@/lib/db";
import { linesToArray, parseAttendees } from "@/lib/parse";

type Props = {
  ctx: ContextFormState;
  onChange: (next: ContextFormState) => void;
  onLoadSample: () => void;
  selectedProjectId: string | null;
  onProjectSelect: (project: ProjectRecord | null) => void;
};

export default function ContextForm({
  ctx,
  onChange,
  onLoadSample,
  selectedProjectId,
  onProjectSelect,
}: Props) {
  const update = <K extends keyof ContextFormState>(k: K, v: ContextFormState[K]) =>
    onChange({ ...ctx, [k]: v });

  const attendees = useMemo(() => parseAttendees(ctx.attendees), [ctx.attendees]);
  const terms = useMemo(() => linesToArray(ctx.terms), [ctx.terms]);

  return (
    <div className="canvas-inner">
      <p className="eyebrow">Step 02 — 会議コンテキスト</p>
      <h1 className="h1">会議の前提情報を教えてください</h1>
      <p className="lede">
        この情報は文字起こし精度と要約品質を大きく左右します。<b>専門用語辞書</b>は
        Whisper の prompt パラメータに、<b>出席者・議題</b>は要約時に Claude へ渡されます。
      </p>

      <div className="notice">
        <div className="ico">
          <Icon name="info" size={14} />
        </div>
        <div>
          すべて任意ですが、入力しておくと「弊社の商品名」「業界用語」「人名」の認識精度が
          目に見えて向上します。
          <br />
          <span className="mono" style={{ fontSize: 11 }}>
            prompt token cap: 244 — 重要度の高い用語から自動的に優先されます
          </span>
        </div>
      </div>

      <ProjectPicker
        ctx={ctx}
        selectedProjectId={selectedProjectId}
        onSelect={onProjectSelect}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", margin: "12px 0" }}>
        <button className="btn btn-sm" onClick={onLoadSample} type="button">
          <Icon name="sparkle" size={11} />
          サンプルを読み込む
        </button>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="field-row">
          <div className="field">
            <label className="label">会議名</label>
            <input
              className="input"
              value={ctx.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="商品企画部 Q3定例会議"
            />
          </div>
          <div className="field">
            <label className="label">開催日時</label>
            <input
              className="input mono"
              value={ctx.datetime}
              onChange={(e) => update("datetime", e.target.value)}
              placeholder="2026/05/09 14:00〜15:42"
            />
          </div>
        </div>
        <div className="field-row" style={{ marginTop: 12 }}>
          <div className="field">
            <label className="label">
              場所 <span className="hint">会議室名 or オンライン</span>
            </label>
            <input
              className="input"
              value={ctx.place}
              onChange={(e) => update("place", e.target.value)}
              placeholder="本社 A-301 / Zoom併用"
            />
          </div>
          <div className="field">
            <label className="label">議事録作成者</label>
            <input
              className="input"
              value={ctx.author}
              onChange={(e) => update("author", e.target.value)}
              placeholder="中村 葵"
            />
          </div>
        </div>
      </div>

      <div className="section-h">
        <h2>出席者リスト</h2>
        <span className="sub">1行に1名 — 「氏名 / 部署」</span>
      </div>
      <textarea
        className="textarea jp"
        value={ctx.attendees}
        onChange={(e) => update("attendees", e.target.value)}
        placeholder={"田中 真一 / 商品企画部\n佐藤 由美子 / マーケティング部"}
      />
      {attendees.length > 0 && (
        <div className="chips">
          {attendees.map((a, i) => (
            <span key={i} className="chip">
              <span className="chip-avatar">{a.initial}</span>
              {a.name}
              {a.dept && <span className="chip-dept">{a.dept}</span>}
            </span>
          ))}
        </div>
      )}

      <div className="section-h">
        <h2>議題リスト</h2>
        <span className="sub">1行に1議題</span>
      </div>
      <textarea
        className="textarea jp"
        value={ctx.agenda}
        onChange={(e) => update("agenda", e.target.value)}
        placeholder="Q2業績振り返り"
      />

      <div className="section-h">
        <h2>専門用語辞書</h2>
        <span className="sub">社名・商品名・人名・業界用語</span>
      </div>
      <textarea
        className="textarea mono"
        value={ctx.terms}
        onChange={(e) => update("terms", e.target.value)}
        placeholder={"ホスピタリティ・プラス\n山田工業株式会社\nARPU"}
      />
      {terms.length > 0 && (
        <div className="terms" style={{ marginTop: 10 }}>
          {terms.map((t, i) => (
            <span key={i} className="term">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
