// minuet — main app shell

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "density": "regular",
  "accent": "#2563eb",
  "layout": "single"
}/*EDITMODE-END*/;

const STEPS = [
  { id: "upload",   label: "アップロード", lat: "Upload" },
  { id: "context",  label: "コンテキスト", lat: "Context" },
  { id: "progress", label: "生成", lat: "Generate" },
  { id: "preview",  label: "プレビュー", lat: "Review" },
];

const DEFAULT_CTX = {
  title: "商品企画部 Q3定例会議",
  datetime: "2026/05/09 14:00〜15:42",
  place: "本社 A-301 / Zoom併用",
  author: "中村 葵",
  attendees: SAMPLE_ATTENDEES.map(a => `${a.name} / ${a.dept}`).join("\n"),
  agenda: SAMPLE_AGENDA.join("\n"),
  terms: SAMPLE_TERMS.join("\n"),
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [step, setStep] = React.useState(0);
  const [file, setFile] = React.useState(null);
  const [ctx, setCtx] = React.useState(DEFAULT_CTX);
  const [showExport, setShowExport] = React.useState(false);

  // progress phase animation
  const [phase, setPhase] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [logs, setLogs] = React.useState([]);
  const intervalRef = React.useRef(null);

  React.useEffect(() => {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.dataset.density = t.density;
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--accent-soft", hexToSoft(t.accent));
    document.documentElement.style.setProperty("--accent-ink", hexShift(t.accent, -12));
  }, [t]);

  // run progress animation when entering step 2
  React.useEffect(() => {
    if (step !== 2) {
      setPhase(0); setProgress(0); setLogs([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const seq = [
      { ts: "14:21:03", lvl: "info", msg: "ffmpeg: input.m4a → mp3 mono 16kHz 96kbps (78.4MB → 73.2MB)" },
      { ts: "14:21:11", lvl: "info", msg: "silencedetect: 142 silence regions found" },
      { ts: "14:21:12", lvl: "ok",   msg: "10 chunks created (avg 10:14, max 11:48)" },
      { ts: "14:21:14", lvl: "info", msg: "Whisper: dispatching 10 parallel requests" },
      { ts: "14:21:16", lvl: "info", msg: "prompt: ホスピタリティ・プラス、山田工業株式会社、ARPU、… (10 terms)" },
      { ts: "14:22:31", lvl: "ok",   msg: "transcripts received: 47,283 chars total" },
      { ts: "14:22:32", lvl: "info", msg: "Claude: tool=create_gijiroku, model=claude-sonnet" },
      { ts: "14:23:18", lvl: "ok",   msg: "structured output validated · 5 decisions · 5 todos" },
      { ts: "14:23:22", lvl: "info", msg: "post-processing: 5W2H check, 西暦 normalize, speaker map" },
      { ts: "14:23:24", lvl: "ok",   msg: "議事録 ready" },
    ];
    let pct = 0;
    let logI = 0;
    intervalRef.current = setInterval(() => {
      pct += 1.4 + Math.random() * 1.2;
      if (pct >= 100) pct = 100;
      setProgress(pct);
      const newPhase = Math.min(3, Math.floor(pct / 25));
      setPhase(newPhase);
      // push logs proportionally
      const targetLogs = Math.min(seq.length, Math.floor(pct / 9.5));
      if (targetLogs > logI) {
        setLogs(seq.slice(0, targetLogs));
        logI = targetLogs;
      }
      if (pct >= 100) {
        clearInterval(intervalRef.current);
        setTimeout(() => setStep(3), 700);
      }
    }, 130);
    return () => clearInterval(intervalRef.current);
  }, [step]);

  const canForward = step === 0 ? !!file : step === 1 ? true : false;

  const goNext = () => {
    if (step === 1) setStep(2);
    else if (step === 0 && file) setStep(1);
  };

  const goStep = (i) => {
    // allow free navigation between steps for demo
    if (i === 2 && !file) return;
    setStep(i);
  };

  return (
    <div className="app">
      {/* topbar */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">m</div>
          minuet
          <span className="brand-jp">AI 議事録ジェネレーター</span>
        </div>
        <div className="topbar-right">
          <span className="tag live">処理中の会議 0件</span>
          <span style={{ width: 1, height: 18, background: "var(--line-2)" }} />
          <span>ヘルプ</span>
          <span className="kbd">⌘K</span>
        </div>
      </header>

      {/* stepper */}
      <nav className="stepper">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            {i > 0 && <span className="step-sep" />}
            <button
              className="step"
              data-active={step === i ? "" : null}
              data-done={step > i ? "" : null}
              onClick={() => goStep(i)}
            >
              <span className="step-num">
                {step > i ? <Icon name="check" size={11} /> : String(i + 1).padStart(2, "0")}
              </span>
              <span className="step-jp">{s.label}</span>
              <span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>{s.lat}</span>
            </button>
          </React.Fragment>
        ))}
      </nav>

      {/* canvas */}
      <main className="canvas">
        {step === 0 && <UploadScreen file={file} setFile={setFile} />}
        {step === 1 && <ContextForm ctx={ctx} setCtx={setCtx} />}
        {step === 2 && <ProgressScreen phase={phase} progress={progress} logs={logs} onCancel={() => setStep(1)} />}
        {step === 3 && <PreviewScreen ctx={ctx} layout={t.layout} onExport={() => setShowExport(true)} />}
      </main>

      {/* footbar */}
      {step < 3 && (
        <footer className="footbar">
          <div className="info">
            {step === 0 && (file ? <>準備完了 — 次へ進んで会議の前提情報を入力してください</> : <>音声ファイルをアップロードしてください</>)}
            {step === 1 && <>入力済み — <b>{ctx.attendees.split("\n").filter(Boolean).length}名の出席者</b> · <b>{ctx.terms.split("\n").filter(Boolean).length}件の用語</b> · <b>{ctx.agenda.split("\n").filter(Boolean).length}件の議題</b></>}
            {step === 2 && <>所要時間: 通常3〜4分 · API合計コスト ¥152</>}
          </div>
          <div className="actions">
            {step > 0 && step < 2 && <button className="btn" onClick={() => setStep(step - 1)}><Icon name="back" size={13} /> 戻る</button>}
            {step === 0 && <button className="btn btn-lg btn-primary" disabled={!file} onClick={() => setStep(1)}>次へ <Icon name="arrow" size={14} /></button>}
            {step === 1 && <button className="btn btn-lg btn-primary" onClick={() => setStep(2)}><Icon name="sparkle" size={13} /> 議事録を生成</button>}
          </div>
        </footer>
      )}

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="テーマ" />
        <TweakRadio label="モード" value={t.theme} options={["light", "dark"]} onChange={(v) => setTweak("theme", v)} />
        <TweakColor label="アクセント" value={t.accent}
          options={["#2563eb", "#0f766e", "#b45309", "#7c3aed", "#18181b"]}
          onChange={(v) => setTweak("accent", v)} />

        <TweakSection label="レイアウト" />
        <TweakRadio label="密度" value={t.density} options={["compact", "regular", "comfortable"]} onChange={(v) => setTweak("density", v)} />
        <TweakRadio label="プレビュー表示" value={t.layout} options={["single", "split"]} onChange={(v) => setTweak("layout", v)} />

        <TweakSection label="デモ操作" />
        <TweakSelect label="ステップに移動" value={String(step)}
          options={[
            { value: "0", label: "01 — アップロード" },
            { value: "1", label: "02 — コンテキスト" },
            { value: "2", label: "03 — 生成中" },
            { value: "3", label: "04 — プレビュー" },
          ]}
          onChange={(v) => { if (v === "2" || v === "3") setFile(file || { name: "Q3定例.m4a", size: "78.4 MB", duration: "1:42:18" }); setStep(parseInt(v, 10)); }} />
        <TweakButton label="エクスポートを開く" onClick={() => { setStep(3); setFile(file || { name: "Q3定例.m4a", size: "78.4 MB", duration: "1:42:18" }); setShowExport(true); }} />
      </TweaksPanel>
    </div>
  );
}

// helpers — accent derivation
function hexToSoft(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, 0.10)`;
}
function hexShift(hex, delta) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v) => Math.max(0, Math.min(255, v + delta));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}
function hexToRgb(hex) {
  const m = hex.replace("#", "");
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
