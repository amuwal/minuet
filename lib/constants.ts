export const STEPS = [
  { id: "upload", label: "アップロード", lat: "Upload" },
  { id: "context", label: "コンテキスト", lat: "Context" },
  { id: "progress", label: "生成", lat: "Generate" },
  { id: "preview", label: "プレビュー", lat: "Review" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export const PHASES = [
  {
    id: "chunk",
    label: "音声分割",
    desc: "無音区間を検出してチャンク化",
    meta: "ffmpeg / silencedetect",
  },
  {
    id: "stt",
    label: "文字起こし",
    desc: "Whisper APIで並列処理",
    meta: "用語辞書を適用",
  },
  {
    id: "summarize",
    label: "要約・構造化",
    desc: "Claudeが議事録形式に整形",
    meta: "tool-use schema",
  },
  {
    id: "format",
    label: "整形・検証",
    desc: "5W2H・西暦・話者紐付けを確認",
    meta: "post-processing",
  },
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];

export const PHASE_RANGES: Record<PhaseId, { from: number; to: number }> = {
  chunk: { from: 0, to: 15 },
  stt: { from: 15, to: 75 },
  summarize: { from: 75, to: 95 },
  format: { from: 95, to: 100 },
};

export const EXPORT_FORMATS = [
  {
    id: "docx",
    ext: "DOCX",
    title: "Word 文書 (.docx)",
    desc: "Yu Gothic 適用済み。日本語フォント崩れなし。",
  },
  {
    id: "md",
    ext: "MD",
    title: "Markdown (.md)",
    desc: "GitHub / Notion / Slack に貼り付け可能。",
  },
  {
    id: "txt",
    ext: "TXT",
    title: "プレーンテキスト (.txt)",
    desc: "メール本文に直接貼り付ける場合。",
  },
  {
    id: "pdf",
    ext: "PDF",
    title: "PDF (.pdf)",
    desc: "ブラウザの印刷機能で書き出し（ベータ）。",
  },
] as const;

export type ExportFormatId = (typeof EXPORT_FORMATS)[number]["id"];

export const ACCEPTED_AUDIO_EXTS = ["mp3", "m4a", "wav", "mp4", "mov", "webm"];

export const ACCEPTED_AUDIO_MIME =
  "audio/*,video/*,.mp3,.m4a,.wav,.mp4,.mov,.webm";
