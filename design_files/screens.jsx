// Screens — Upload, Context, Progress, Preview, Export
// Each screen is a focused component; App in app.jsx orchestrates.

const { useState, useEffect, useRef, useMemo } = React;

// ─── Icons (inline SVG, minimal) ────────────────────────
const Icon = ({ name, size = 16 }) => {
  const s = { width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "upload":   return <svg viewBox="0 0 24 24" {...s}><path d="M12 16V4M12 4l-5 5M12 4l5 5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>;
    case "audio":    return <svg viewBox="0 0 24 24" {...s}><path d="M9 18V8l10-2v10"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>;
    case "x":        return <svg viewBox="0 0 24 24" {...s}><path d="M18 6L6 18M6 6l12 12"/></svg>;
    case "check":    return <svg viewBox="0 0 24 24" {...s}><path d="M5 12l4 4L19 6"/></svg>;
    case "play":     return <svg viewBox="0 0 24 24" {...s} fill="currentColor" stroke="none"><path d="M7 4l12 8-12 8V4z"/></svg>;
    case "pause":    return <svg viewBox="0 0 24 24" {...s} fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
    case "edit":     return <svg viewBox="0 0 24 24" {...s}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
    case "download": return <svg viewBox="0 0 24 24" {...s}><path d="M12 4v12M12 16l-5-5M12 16l5-5"/><path d="M4 20h16"/></svg>;
    case "info":     return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>;
    case "sparkle":  return <svg viewBox="0 0 24 24" {...s}><path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8L12 3z"/></svg>;
    case "arrow":    return <svg viewBox="0 0 24 24" {...s}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case "back":     return <svg viewBox="0 0 24 24" {...s}><path d="M19 12H5M11 18l-6-6 6-6"/></svg>;
    case "doc":      return <svg viewBox="0 0 24 24" {...s}><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/></svg>;
    case "split":    return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/></svg>;
    case "copy":     return <svg viewBox="0 0 24 24" {...s}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>;
    default: return null;
  }
};

// ─── Waveform mock (deterministic) ────────────────────────
function Waveform({ count = 38, seed = 1 }) {
  const bars = useMemo(() => {
    const arr = [];
    let s = seed;
    for (let i = 0; i < count; i++) {
      s = (s * 9301 + 49297) % 233280;
      const r = s / 233280;
      arr.push(8 + Math.round(r * 20 + Math.sin(i * 0.4) * 4));
    }
    return arr;
  }, [count, seed]);
  return (
    <div className="wave">
      {bars.map((h, i) => <i key={i} style={{ height: h + "px" }} />)}
    </div>
  );
}

// ─── 1. Upload screen ────────────────────────
function UploadScreen({ onContinue, file, setFile }) {
  const [hover, setHover] = useState(false);
  const handlePick = () => {
    setFile({ name: "Q3定例_商品企画部_2026-05-09.m4a", size: "78.4 MB", duration: "1:42:18" });
  };
  return (
    <div className="canvas-inner">
      <p className="eyebrow">Step 01 — 音声ファイルのアップロード</p>
      <h1 className="h1">会議の音声ファイルを選択してください</h1>
      <p className="lede">
        最大 約2時間の録音に対応。サーバー側で 16kHz mono に変換し、無音区間を検出して
        分割してから Whisper API で並列処理を行います。
      </p>

      {!file ? (
        <div
          className="dropzone"
          data-hover={hover ? "" : null}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={handlePick}
        >
          <div className="ico"><Icon name="upload" size={22} /></div>
          <h3>ここに音声ファイルをドロップ</h3>
          <div className="muted jp" style={{ fontSize: 12.5 }}>
            またはクリックしてファイルを選択
          </div>
          <div className="formats">
            <span>MP3</span>·<span>M4A</span>·<span>WAV</span>·<span>MP4</span>·<span>MOV</span>·<span>WEBM</span>
          </div>
        </div>
      ) : (
        <>
          <div className="filerow">
            <div className="ico"><Icon name="audio" size={18} /></div>
            <div className="meta">
              <div className="name">{file.name}</div>
              <div className="sub">{file.size} · {file.duration} · stereo 44.1kHz → mono 16kHz</div>
            </div>
            <Waveform />
            <button className="x" onClick={() => setFile(null)} title="削除"><Icon name="x" /></button>
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="tag">10チャンクに分割予定</span>
            <span className="tag">推定処理時間 3-4分</span>
            <span className="tag">¥152 / 1回</span>
          </div>
        </>
      )}

      <div className="section-h">
        <h2>サンプル音声で試す</h2>
        <span className="sub">実音声をお持ちでない場合</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { name: "商品企画部 Q3定例会議", duration: "1:42:18", role: "社内定例" },
          { name: "新規取引先 商談キックオフ", duration: "0:38:42", role: "商談" },
        ].map((s, i) => (
          <button key={i} className="card" style={{ textAlign: "left", border: "1px solid var(--line)", cursor: "pointer", background: "var(--surface)" }} onClick={() => setFile({ name: s.name + ".m4a", size: "78.4 MB", duration: s.duration })}>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-jp)" }}>{s.name}</div>
            <div className="mono muted" style={{ fontSize: 11.5, marginTop: 4 }}>{s.duration} · {s.role}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 2. Context form ────────────────────────
function ContextForm({ ctx, setCtx, onContinue, onBack }) {
  const update = (k, v) => setCtx({ ...ctx, [k]: v });

  // Parse attendees from textarea (lines like "氏名 / 部署")
  const parsedAttendees = useMemo(() => {
    return ctx.attendees.split("\n").filter(l => l.trim()).map(l => {
      const [name, dept] = l.split("/").map(s => s && s.trim());
      return { name: name || l.trim(), dept: dept || "", initial: (name || l)[0] || "?" };
    });
  }, [ctx.attendees]);

  const parsedTerms = useMemo(() => ctx.terms.split("\n").map(t => t.trim()).filter(Boolean), [ctx.terms]);

  return (
    <div className="canvas-inner">
      <p className="eyebrow">Step 02 — 会議コンテキスト</p>
      <h1 className="h1">会議の前提情報を教えてください</h1>
      <p className="lede">
        この情報は文字起こし精度と要約品質を大きく左右します。<b>専門用語辞書</b>は
        Whisper の prompt パラメータに、<b>出席者・議題</b>は要約時に Claude へ渡されます。
      </p>

      <div className="notice">
        <div className="ico"><Icon name="info" size={14} /></div>
        <div>
          すべて任意ですが、入力しておくと「弊社の商品名」「業界用語」「人名」の認識精度が
          目に見えて向上します。<br/>
          <span className="mono" style={{ fontSize: 11 }}>prompt token cap: 244 — 重要度の高い用語から自動的に優先されます</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="field-row">
          <div className="field">
            <label className="label">会議名</label>
            <input className="input" value={ctx.title} onChange={e => update("title", e.target.value)} />
          </div>
          <div className="field">
            <label className="label">開催日時</label>
            <input className="input mono" value={ctx.datetime} onChange={e => update("datetime", e.target.value)} />
          </div>
        </div>
        <div className="field-row" style={{ marginTop: 12 }}>
          <div className="field">
            <label className="label">場所 <span className="hint">会議室名 or オンライン</span></label>
            <input className="input" value={ctx.place} onChange={e => update("place", e.target.value)} />
          </div>
          <div className="field">
            <label className="label">議事録作成者</label>
            <input className="input" value={ctx.author} onChange={e => update("author", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="section-h">
        <h2>出席者リスト</h2>
        <span className="sub">1行に1名 — 「氏名 / 部署」</span>
      </div>
      <textarea className="textarea jp" value={ctx.attendees} onChange={e => update("attendees", e.target.value)} placeholder="田中 真一 / 商品企画部&#10;佐藤 由美子 / マーケティング部" />
      {parsedAttendees.length > 0 && (
        <div className="chips">
          {parsedAttendees.map((a, i) => (
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
      <textarea className="textarea jp" value={ctx.agenda} onChange={e => update("agenda", e.target.value)} placeholder="Q2業績振り返り" />

      <div className="section-h">
        <h2>専門用語辞書</h2>
        <span className="sub">社名・商品名・人名・業界用語</span>
      </div>
      <textarea className="textarea mono" value={ctx.terms} onChange={e => update("terms", e.target.value)} placeholder="ホスピタリティ・プラス&#10;山田工業株式会社&#10;ARPU" />
      {parsedTerms.length > 0 && (
        <div className="terms" style={{ marginTop: 10 }}>
          {parsedTerms.map((t, i) => <span key={i} className="term">{t}</span>)}
        </div>
      )}
    </div>
  );
}

// ─── 3. Progress ────────────────────────
function ProgressScreen({ phase, progress, logs, onCancel }) {
  return (
    <div className="canvas-inner" style={{ maxWidth: 720 }}>
      <p className="eyebrow">Step 03 — 議事録を生成中</p>
      <h1 className="h1">音声を解析しています…</h1>
      <p className="lede">
        この処理にはおよそ <b>3〜4分</b> かかります。タブを閉じても処理は継続されます。
      </p>

      <div className="progress-card">
        <div className="row-spread" style={{ marginBottom: 6 }}>
          <span className="jp" style={{ fontWeight: 600, fontSize: 14 }}>{PHASES[phase]?.label || "完了"}</span>
          <span className="progress-eta">ETA  {Math.max(0, Math.ceil(((PHASES.length - phase) * 0.9) * 60))}s</span>
        </div>
        <div className="progress-bar"><i style={{ width: `${progress}%` }} /></div>

        <div className="phases">
          {PHASES.map((p, i) => {
            const state = i < phase ? "done" : i === phase ? "active" : "pending";
            return (
              <div key={p.id} className="phase" data-state={state}>
                <div className="pico">{state === "done" ? <Icon name="check" size={11} /> : i + 1}</div>
                <div className="ptitle">{p.label}</div>
                <div className="pdesc">{p.desc}</div>
                <div className="pmeta">{p.meta}</div>
              </div>
            );
          })}
        </div>

        <div className="log">
          {logs.map((l, i) => (
            <div key={i}>
              <span className="ts">{l.ts}</span>
              <span className={`lvl-${l.lvl}`}>[{l.lvl.toUpperCase()}]</span>{" "}
              <span>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
        <button className="btn btn-ghost" onClick={onCancel}>キャンセル</button>
      </div>
    </div>
  );
}

Object.assign(window, { Icon, Waveform, UploadScreen, ContextForm, ProgressScreen });
