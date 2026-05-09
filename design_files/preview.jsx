// Preview screen — the gijiroku document + transcript sidebar + edit + export

const { useState: useStateP, useMemo: useMemoP } = React;

function PreviewScreen({ ctx, layout, onExport }) {
  const [editMode, setEditMode] = useStateP(false);
  const [currentTs, setCurrentTs] = useStateP("00:03:18");
  const [playing, setPlaying] = useStateP(false);

  const att = SAMPLE_ATTENDEES.map(a => `${a.dept} ${a.name}`).join("、");
  const abs = SAMPLE_ABSENT.map(a => `${a.dept} ${a.name}`).join("、");

  const Doc = (
    <div className="gj-doc" data-edit={editMode ? "" : null}>
      <h1 className="gj-title" contentEditable={editMode} suppressContentEditableWarning>
        商品企画部 Q3定例会議
      </h1>
      <div className="gj-sub">作成日：2026/05/09 · 議事録 v1.0</div>

      <dl className="gj-meta">
        <dt>開催日時</dt><dd contentEditable={editMode} suppressContentEditableWarning>2026/05/09 14:00〜15:42</dd>
        <dt>場所</dt><dd contentEditable={editMode} suppressContentEditableWarning>本社 A-301 会議室 / Zoom併用</dd>
        <dt>出席者</dt><dd contentEditable={editMode} suppressContentEditableWarning>{att}</dd>
        <dt>欠席者</dt><dd contentEditable={editMode} suppressContentEditableWarning>{abs}</dd>
        <dt>作成者</dt><dd contentEditable={editMode} suppressContentEditableWarning>中村 葵（商品企画部）</dd>
      </dl>

      <section className="gj-section">
        <h2 className="gj-h2">議題 <span className="gj-h2-sub">Agenda · {SAMPLE_AGENDA.length}件</span></h2>
        <ol className="gj-list">
          {SAMPLE_AGENDA.map((a, i) => <li key={i} contentEditable={editMode} suppressContentEditableWarning>{a}</li>)}
        </ol>
      </section>

      <section className="gj-section">
        <h2 className="gj-h2">決定事項 <span className="gj-h2-sub">Decisions · {SAMPLE_DECISIONS.length}件</span></h2>
        <ol className="gj-list">
          {SAMPLE_DECISIONS.map((d, i) => <li key={i} contentEditable={editMode} suppressContentEditableWarning>{d}</li>)}
        </ol>
      </section>

      <section className="gj-section">
        <h2 className="gj-h2">議論内容 <span className="gj-h2-sub">Discussion</span></h2>
        {SAMPLE_DISCUSSIONS.map((d, i) => (
          <div className="gj-disc" key={i}>
            <h3>
              <span className="gnum">{i + 1}</span>
              <span contentEditable={editMode} suppressContentEditableWarning>{d.title}</span>
            </h3>
            <dl>
              <div className="gj-disc-row">
                <dt>提案・論点</dt>
                <dd contentEditable={editMode} suppressContentEditableWarning>{d.propose}</dd>
              </div>
              <div className="gj-disc-row">
                <dt>議論の経緯</dt>
                <dd contentEditable={editMode} suppressContentEditableWarning>{d.flow}</dd>
              </div>
              <div className="gj-disc-row">
                <dt>結論</dt>
                <dd contentEditable={editMode} suppressContentEditableWarning>
                  <span className="who">{d.who}</span>{d.conclusion}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </section>

      <section className="gj-section">
        <h2 className="gj-h2">ToDo <span className="gj-h2-sub">5W2H · {SAMPLE_TODOS.length}件</span></h2>
        <table className="gj-table">
          <thead>
            <tr>
              <th>担当者</th>
              <th>内容</th>
              <th>背景・理由</th>
              <th>期限</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_TODOS.map((t, i) => (
              <tr key={i}>
                <td className="who-cell">
                  <span className="who-pill">
                    <span className="av">{t.who[0]}</span>
                    <span contentEditable={editMode} suppressContentEditableWarning>{t.who}</span>
                  </span>
                </td>
                <td contentEditable={editMode} suppressContentEditableWarning>{t.what}</td>
                <td className="muted" contentEditable={editMode} suppressContentEditableWarning>{t.reason}</td>
                <td className="due-cell" contentEditable={editMode} suppressContentEditableWarning>{t.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="gj-section">
        <h2 className="gj-h2">保留・懸案事項 <span className="gj-h2-sub">Pending</span></h2>
        <ul className="gj-list bullet">
          {SAMPLE_PENDING.map((p, i) => <li key={i} contentEditable={editMode} suppressContentEditableWarning>{p}</li>)}
        </ul>
      </section>

      <section className="gj-section">
        <h2 className="gj-h2">次回会議 <span className="gj-h2-sub">Next</span></h2>
        <dl className="gj-next">
          <dt>日時</dt><dd contentEditable={editMode} suppressContentEditableWarning>2026/06/13 14:00〜15:30</dd>
          <dt>場所</dt><dd contentEditable={editMode} suppressContentEditableWarning>本社 A-301 / Zoom併用</dd>
          <dt>議題</dt>
          <dd contentEditable={editMode} suppressContentEditableWarning>
            ① 営業ツールキット刷新案レビュー　② カスタマーサクセス体制強化案　③ Q3進捗中間報告
          </dd>
        </dl>
      </section>
    </div>
  );

  const Side = (
    <aside className="gj-side">
      <div className="gj-side-h">
        <b>文字起こし</b>
        <div className="player">
          <button className="btn btn-icon btn-sm" onClick={() => setPlaying(!playing)} title={playing ? "停止" : "再生"}>
            <Icon name={playing ? "pause" : "play"} size={11} />
          </button>
          <span>{currentTs} / 1:42:18</span>
        </div>
      </div>
      <div className="gj-side-body">
        {SAMPLE_TRANSCRIPT.map((l, i) => (
          <div key={i} className={"tx-line" + (l.ts === currentTs ? " cur" : "")} onClick={() => setCurrentTs(l.ts)}>
            <span className="ts">{l.ts.slice(3)}</span>
            <div>
              <span className="spk">{l.spk}</span>
              <span className="txt">{l.txt}</span>
            </div>
          </div>
        ))}
        <div style={{ textAlign: "center", color: "var(--faint)", fontSize: 11, padding: "10px 0", fontFamily: "var(--font-mono)" }}>
          ─ 残り 1:38:54 を表示 ─
        </div>
      </div>
    </aside>
  );

  return (
    <div className={"canvas-inner " + (layout === "split" ? "split" : "wide")}>
      <div className="doc-toolbar">
        <div className="meta">
          <span className="dot" /> <b>議事録</b> <span>·</span>
          <span className="mono">5,847文字</span> <span>·</span>
          <span>生成完了 14:23</span>
        </div>
        <div className="actions">
          <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText("コピーされました")}>
            <Icon name="copy" size={12} /> コピー
          </button>
          <button className="btn btn-sm" data-active={editMode || undefined} onClick={() => setEditMode(!editMode)}>
            <Icon name="edit" size={12} /> {editMode ? "編集を終了" : "編集モード"}
          </button>
          <button className="btn btn-sm btn-primary" onClick={onExport}>
            <Icon name="download" size={12} /> エクスポート
          </button>
        </div>
      </div>

      <div className="gj-shell" style={layout === "split" ? { gridTemplateColumns: "360px 1fr" } : null}>
        {layout === "split" && Side}
        {Doc}
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

// ─── Export modal ────────────────────────
function ExportModal({ onClose }) {
  const [sel, setSel] = useStateP("docx");
  const [done, setDone] = useStateP(false);

  const opts = [
    { id: "docx", ext: "DOCX", title: "Word 文書 (.docx)", desc: "Yu Gothic 適用済み。日本語フォント崩れなし。" },
    { id: "md",   ext: "MD",   title: "Markdown (.md)",   desc: "GitHub / Notion / Slack に貼り付け可能。" },
    { id: "txt",  ext: "TXT",  title: "プレーンテキスト (.txt)", desc: "メール本文に直接貼り付ける場合。" },
    { id: "pdf",  ext: "PDF",  title: "PDF (.pdf)",       desc: "ベータ機能 — Word変換経由で生成。" },
  ];

  const handleDownload = () => {
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1400);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <h3>議事録をエクスポート</h3>
          <div className="sub">出力形式を選択してください</div>
        </div>
        <div className="modal-body">
          <div className="export-opts">
            {opts.map(o => (
              <button key={o.id} className="export-opt" data-selected={sel === o.id || undefined} onClick={() => setSel(o.id)}>
                <div className="x-ico">{o.ext}</div>
                <div className="meta">
                  <div className="t">{o.title}</div>
                  <div className="d">{o.desc}</div>
                </div>
                {sel === o.id && <Icon name="check" size={14} />}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--surface-2)", borderRadius: 8, fontSize: 12 }}>
            <span className="jp muted">ファイル名</span>
            <span className="mono" style={{ color: "var(--ink)" }}>
              gijiroku_2026-05-09_q3-product-planning.{sel}
            </span>
          </div>
        </div>
        <div className="modal-foot">
          <span className="note">メールで直接送信する場合は v2 にて対応予定</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={onClose}>キャンセル</button>
            <button className="btn btn-sm btn-primary" onClick={handleDownload}>
              {done ? <><Icon name="check" size={12} /> 完了</> : <><Icon name="download" size={12} /> ダウンロード</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PreviewScreen, ExportModal });
