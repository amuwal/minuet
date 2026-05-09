# minuet — AI議事録ジェネレーター

> 日本のビジネス会議の音声から、標準フォーマットに沿った議事録を自動生成するNext.jsアプリ。
> A Next.js app that generates standard-format Japanese business meeting minutes (議事録) from raw audio.

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)]()
[![OpenAI Whisper](https://img.shields.io/badge/OpenAI-Whisper--1-412991?logo=openai&logoColor=white)]()
[![Anthropic Claude](https://img.shields.io/badge/Anthropic-Claude%20Sonnet-d97757?logo=anthropic&logoColor=white)]()

📺 **デモ動画 / Interactive demo:** https://app.supademo.com/demo/cmoy55rr708bi4qulg4anazog

![Generated 議事録 preview](docs/preview.png)

---

## 日本語

### 概要

`minuet` は、日本のビジネス慣習に即した議事録（meeting minutes）を音声ファイルから自動生成するWebアプリです。市販の議事録ツール（Notta、スマート書記、tl;dv 等）と異なり、**カスタム用語辞書、議事録フォーマット、デプロイ環境を企業ごとに調整できる** 構成を念頭に設計しています。

### 主要機能

- **音声 → 議事録の自動生成パイプライン**: ffmpeg で 16kHz mono mp3 に正規化 → 無音区間検出による分割 → Whisper API で並列文字起こし → Claude tool-use で構造化 → 標準フォーマットで出力
- **専門用語辞書**: 社名・商品名・業界用語を Whisper の `prompt` パラメータに渡し、認識精度を向上
- **NDJSON ストリーミング**: 1〜6分かかる処理の進捗をリアルタイムでフロントに反映
- **インライン編集**: `contenteditable` ベースの編集モードで生成後に直接修正
- **音声同期トランスクリプト**: 文字起こしのタイムスタンプから音声を頭出し再生
- **多形式エクスポート**: Word (.docx, 日本語フォント対応) / Markdown / プレーンテキスト / PDF
- **履歴管理**: IndexedDB で会議データと音声 Blob を端末内に保存
- **テーマシステム**: ライト・ダーク、密度、レイアウト、アクセントカラーをすべて永続化

### 想定ユースケース

- 中小企業の社内会議・商談記録の効率化
- 議事録フォーマットを社内標準に合わせたカスタムデプロイ
- プライバシー重視企業のための自社ホスティング（自前のWhisper/Claude APIキーで運用可能）

---

## English

### What this is

`minuet` is a web app that converts Japanese business-meeting audio into properly-formatted 議事録 (meeting minutes). Unlike off-the-shelf SaaS tools, it's designed to be **customized per company** — terminology dictionaries, output templates, and deployment environments can all be adjusted to a specific organization.

### Key features

- **Audio → minutes pipeline**: ffmpeg normalize → silence-aware chunking → parallel Whisper transcription → Claude tool-use for structured output → standard JP business format
- **Term-dictionary biasing**: company names, product names, and jargon passed to Whisper's `prompt` parameter for accuracy
- **NDJSON progress streaming** for the 1–6 min processing window
- **Inline editing** via `contenteditable`
- **Synced transcript playback** with timestamp-based seek
- **Multi-format export**: Word (with Japanese font hints), Markdown, plain text, PDF
- **History persistence** via IndexedDB (meeting data + audio Blob, fully client-side)
- **Theme system** with light/dark, density, layout, and accent customization

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + React Server Components where applicable |
| Language | TypeScript (strict) |
| Audio processing | `ffmpeg-static` + `fluent-ffmpeg` (silence detection, chunking, normalization) |
| Speech-to-text | OpenAI Whisper API (`whisper-1`) with prompt-based term biasing |
| LLM | Anthropic Claude Sonnet, tool-use for enforced JSON schema output |
| Storage | IndexedDB (no backend; meeting data + audio Blobs stored client-side) |
| Styling | Pure CSS with custom-property design tokens (no Tailwind) |
| Document export | `docx` (Word with Japanese font hints), browser print API (PDF) |
| Fonts | Inter / Noto Sans JP / JetBrains Mono via `next/font` (self-hosted, swap-display) |

---

## Architecture

```
[mp3/m4a/wav/mp4/mov/webm]
        ↓ multipart upload
[POST /api/process]
        ↓ ffmpeg → 16kHz mono mp3 96kbps
        ↓ silencedetect at -30dB / 0.5s min
        ↓ 10-min target chunks at silence boundaries
[Whisper API (parallel, concurrency 4)]
        ↓ per-chunk prompt = previous-tail + term-dictionary
[Claude Sonnet tool-use]
        ↓ ASCII-key schema → Japanese-keyed Gijiroku type
[NDJSON stream → client]
        ↓ phase / progress / log / result events
[Rendered 議事録 + multi-format export]
```

Notable engineering decisions documented in `docs/decisions.md` (if present) include silence-aware chunking strategy, the Whisper-prompt accuracy lever, ASCII-key schema workaround for Anthropic's tool-use regex, and the IndexedDB blob-storage pattern.

---

## Local development

```bash
# 1. Install
npm install

# 2. Provide API keys
cp .env.example .env.local

# Required env vars:
#   OPENAI_API_KEY=sk-...
#   ANTHROPIC_API_KEY=sk-ant-...
#   CREATE_PASSWORD=your_password_here

# 3. Run dev
npm run dev   # http://localhost:3000

# 4. Production
npm run build && npm start

# 5. Type check / lint
npm run typecheck
npm run lint
```

ffmpeg is bundled via `ffmpeg-static`; no system install required.

### About the create-password gate

Viewing the app and browsing meeting history is fully open. Generating a new 議事録 (which calls Whisper + Claude APIs) requires a password set via the `CREATE_PASSWORD` env var. This is intentional — it lets prospects browse the polished UI without my API budget being abused by random visitors.

If you want unrestricted local use, set `CREATE_PASSWORD` to anything in your `.env.local`.

---

## Out of scope (v1)

Intentionally not built — each is a substantial extension:

- Real-time recording / live mode
- Multi-tenant SaaS / accounts
- True ML diarization (Claude inference from attendee list is the v1 substitute)
- Calendar / Zoom / Teams auto-join
- Slack / email auto-distribution
- Self-host Whisper / Claude

---

## License

MIT
