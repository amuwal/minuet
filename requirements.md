# AI 議事録ジェネレーター — Build Spec

A working tool that takes a Japanese meeting audio file (up to ~2 hours) and produces a polished, structured 議事録 in standard Japanese business format.

Goal: an SMB owner watches a 90-second demo and immediately wants it customized for their company. Not a "look at me using Whisper" toy.

---

## Why this design (not just slapping Whisper + GPT together)

Researched the existing JP market: **Notta, スマート書記, tl;dv, ZMEETING, AI議事録取れる君, AmiVoice ScribeAssist, YOMEL** — all serious players with 90%+ accuracy, dictionary registration, speaker separation, calendar integration. The market is crowded.

Six things demos always skip but real tools handle:

1. **Custom term dictionary** — every Japanese company has unique 社名 / 商品名 / 業界用語. Without this, transcription consistently mangles 弊社の「ホスピタリティ・プラス」 and similar. Whisper's `prompt` parameter biases toward provided terms — this is the single biggest accuracy lever.
2. **Long meetings** — Whisper API hard-caps at 25MB per request. Real meetings are 1–2 hours = 50–200MB. Chunking is mandatory, not optional.
3. **Speaker association** — even without ML diarization, attribute decisions/quotes to attendees by name. Skipping this kills the demo.
4. **Standard JP 議事録 format** — not a generic "meeting summary." Specific fields, specific order, specific style.
5. **Word export** — JP SMBs email .docx files. Markdown alone won't get adopted.
6. **5W2H ToDo extraction** — 誰が / いつまでに / 何を / なぜ in a structured table. Bare bullet lists are useless for action tracking.

If you skip any of these, the demo dies in front of an SMB owner. They've already seen Notta.

---

## Standard 議事録 format (commit to this template)

Consensus across Japanese business sources (Ricoh, MoneyForward, スマート書記 blog, Insource):

```markdown
# [会議名]

- 作成日：YYYY/MM/DD
- 開催日時：YYYY/MM/DD HH:MM〜HH:MM
- 場所：[会議室名 or オンラインツール名]
- 出席者：[部署 名前], [部署 名前], …
- 欠席者：[名前]
- 議事録作成者：[名前]

## 議題
1. …
2. …

## 決定事項
1. …
2. …

## 議論内容
### 議題1：…
- 提案・論点
- 議論の経緯
- 結論に至った理由

## ToDo
| 担当者 | 内容 | 期限 |
| --- | --- | --- |
| 田中 | … | YYYY/MM/DD |

## 保留・懸案事項
- …

## 次回会議
- 日時：YYYY/MM/DD HH:MM
- 議題：…
```

This is THE format. Don't invent your own. Dates use 西暦 + 24-hour.

---

## User flow

1. **Upload audio** (drag & drop, file picker)
2. **Pre-meeting context form** (optional but encouraged):
   - 会議名
   - 出席者リスト (姓名 + 部署, one per line)
   - 議題リスト (textarea, one per line)
   - 専門用語辞書 (textarea, one term per line — 社名, 商品名, 業界用語, 人名)
3. Click **「議事録生成」**
4. Progress indicator (チャンク分割中 → 文字起こし中 → 要約中 → 整形中)
5. Preview the rendered 議事録
6. Inline edit if needed (contenteditable or a simple textarea per section)
7. Export: **Markdown / Word (.docx) / Plain text**
8. Optional: send to email (skip for v1 if pressed for time)

---

## Stack

- **Next.js 14** (app router), TypeScript, Tailwind
- **Vercel** deploy (note: Vercel serverless has a 60s timeout on Hobby plan, 300s on Pro — Whisper transcription of a chunked 2hr meeting can take 60-120s. Use Pro tier or move long-running work to a queue. For portfolio demo, Pro is ¥3,000/月 and worth it.)
- **OpenAI Whisper API** for transcription
- **Anthropic Claude API** (`claude-sonnet`) for summarization
- **ffmpeg** (`ffmpeg-static` + `fluent-ffmpeg`) for audio prep + chunking
- **`docx`** npm package for Word export
- No DB for v1. Process and forget.

---

## File structure

```
/app
  /page.tsx                  — Landing + upload UI
  /api
    /transcribe/route.ts     — POST audio → Whisper → transcript
    /generate/route.ts       — POST transcript + context → Claude → gijiroku JSON
    /export/route.ts         — POST gijiroku JSON → docx/md/txt
/lib
  /audio.ts                  — ffmpeg conversion + silence-aware chunking
  /whisper.ts                — OpenAI Whisper client + term-dictionary prompt biasing
  /claude.ts                 — Claude client + tool-use schema for structured output
  /docx.ts                   — Word export with Japanese fonts
  /prompts/
    gijiroku-system.txt      — Japanese system prompt
/components
  /UploadZone.tsx
  /ContextForm.tsx           — 出席者, 議題, 用語辞書
  /GijirokuPreview.tsx
  /ExportButtons.tsx
```

---

## Critical implementation details

### 1. Audio prep (ffmpeg)

User uploads any of: mp3, m4a, wav, mp4, mov, webm.

Server-side: convert to **mp3 64–128kbps mono 16kHz** before chunking. This is Whisper's sweet spot and shrinks file size dramatically.

```bash
ffmpeg -i input.wav -ac 1 -ar 16000 -b:a 96k -codec:a libmp3lame output.mp3
```

A 2-hour meeting at 96kbps mono ≈ 86MB, so chunking still required — but compression alone might bring a 1-hour meeting under the 25MB cap.

### 2. Chunking (the part everyone gets wrong)

**Naive approach:** hard-split at 10:00 marks. Cuts mid-sentence, breaks accuracy at boundaries.

**Right approach:** silence-aware splitting.

```bash
ffmpeg -i input.mp3 -af silencedetect=noise=-30dB:d=0.5 -f null - 2>&1 | grep silence
```

This gives you silence regions. Walk through them and pick split points that are:
- Closest to your 10-minute target
- At least 0.5s of silence
- Never split if it would make a chunk longer than ~15min

For each chunk, also pass the **last 200 chars of the previous chunk's transcript** as Whisper's `prompt` parameter. This dramatically helps continuity at boundaries.

Process chunks **concurrently** (Whisper rate limit is 50 req/min on Tier 1, plenty).

### 3. Whisper call (the term-dictionary trick)

```typescript
const transcription = await openai.audio.transcriptions.create({
  file: chunkStream,
  model: "whisper-1",
  language: "ja",
  response_format: "verbose_json",  // gets you segment timestamps
  prompt: [
    previousChunkTail,           // continuity
    ...termDictionary,           // user's custom terms
  ].join("、"),
});
```

The `prompt` parameter is the key differentiator. Whisper biases its decoding toward terms in this string. Pass company names, product names, person names, industry jargon — anything the user provided in the term dictionary.

Hard cap on `prompt`: ~244 tokens. If user provides 100 terms, prioritize the longest/most-unique ones.

### 4. Claude summarization (use tool-use for structured output)

Don't just ask Claude to "write a 議事録 in markdown" and hope. Use tool-use to enforce schema:

```typescript
const gijirokuTool = {
  name: "create_gijiroku",
  description: "標準的な日本のビジネス議事録を生成する",
  input_schema: {
    type: "object",
    properties: {
      会議名: { type: "string" },
      開催日時: { type: "string" },
      出席者: { type: "array", items: { type: "string" } },
      議題: { type: "array", items: { type: "string" } },
      決定事項: { type: "array", items: { type: "string" } },
      議論内容: {
        type: "array",
        items: {
          type: "object",
          properties: {
            議題: { type: "string" },
            提案_論点: { type: "string" },
            議論経緯: { type: "string" },
            結論: { type: "string" },
          },
          required: ["議題", "結論"],
        },
      },
      ToDo: {
        type: "array",
        items: {
          type: "object",
          properties: {
            担当者: { type: "string" },
            内容: { type: "string" },
            期限: { type: "string" },
          },
          required: ["担当者", "内容"],
        },
      },
      保留懸案事項: { type: "array", items: { type: "string" } },
      次回会議: {
        type: "object",
        properties: {
          日時: { type: "string" },
          議題: { type: "array", items: { type: "string" } },
        },
      },
    },
    required: ["決定事項", "議論内容", "ToDo"],
  },
};
```

Force Claude to use this tool with `tool_choice: { type: "tool", name: "create_gijiroku" }`.

### 5. System prompt rules

The system prompt must specify:

- Output is for a Japanese business meeting record (議事録).
- Inject the user's attendee list, agenda, term dictionary verbatim into the prompt.
- Use **体言止め for fields** (e.g.「導入決定」), **plain です・ます for explanations**.
- **5W2H** for ToDo: 誰が、いつまでに、何を、なぜ.
- **西暦 + 24時間表記** for all dates and times.
- **Strip filler**: 「えー」「あのー」「まあ」「えーっと」 — never include in output.
- **Attribute decisions to people by name** when the transcript context allows. If unclear, say「（発言者不明）」.
- **客観的記述**, no emotional language, no editorializing.

Save this as `lib/prompts/gijiroku-system.txt` and version it as you iterate.

### 6. Word export (`docx` npm package)

Markdown alone won't get clients. Build proper .docx:

```typescript
import { Document, Paragraph, TextRun, Table, TableRow, TableCell } from "docx";

// Critical: set Japanese font on EVERY TextRun
const jpRun = (text: string, opts = {}) => new TextRun({
  text,
  font: { name: "Yu Gothic", hint: "eastAsia" },
  ...opts,
});
```

Without explicit Japanese font hint, some Word installations render JP text in fallback fonts that look broken. This is the kind of detail that separates "demo" from "real."

### 7. Speaker association (without ML diarization)

Don't add `pyannote` / Replicate / AssemblyAI in v1 — too much weekend cost.

Instead: pass the full transcript + attendee list to Claude, and let Claude infer speakers from context. In the system prompt:

> 出席者リストは {attendees} です。発言の文脈から発言者が推測できる場合は名前を付与してください。不明な場合は「（発言者不明）」としてください。

This is good enough for portfolio. v2 adds real diarization.

---

## What "done" looks like (Sunday hour 16)

A deployed Vercel URL where:

1. Upload a 30–60 min Japanese meeting audio file
2. Fill in attendees, agenda, and 5–10 domain terms
3. Click 「議事録生成」
4. Within 3–5 minutes, see a properly formatted Japanese 議事録 with all standard fields populated
5. Export as .docx, open in Word, Japanese renders cleanly with proper fonts

Then record a **90-second Japanese 操作デモ video** (use Loom or QuickTime). This is your sales asset for cold outreach. **Don't post publicly** — keep it for DMs and email attachments.

---

## v1 explicitly NOT building (each is a weekend on its own)

- Real-time recording / live mode (browser MediaRecorder)
- Auth / accounts (just process and forget)
- Database / saved meetings
- True ML diarization (pyannote, AssemblyAI) — Claude inference is good enough
- Calendar / Zoom / Teams auto-join
- Multi-tenant
- Branding customization beyond the template
- Slack / email auto-distribution

Resist all of these. Each adds a weekend. Ship v1 first.

---

## Cost reality check (per 2-hour meeting)

- Whisper API: 120min × $0.006 = $0.72 ≈ ¥108
- Claude Sonnet: ~50k in + 5k out ≈ $0.25 ≈ ¥38
- **Total: ~¥150/meeting**

If a client uses this 30 times/month: ~¥4,500/month in API costs. The consulting pitch (¥50,000 setup + ¥30,000–50,000/月 hosting + maintenance) leaves comfortable margin even at heavy use.

---

## The consulting wedge (why this portfolio piece even exists)

When showing this demo to an SMB owner, the actual sales line is:

> 「市販の Notta やスマート書記もありますが、御社の独自用語、議事録フォーマット、Slack 連携などは標準では対応できません。これは御社専用にカスタマイズして導入できます。初期 50万、月額 5万、御社のサーバーで動かすこともできます。」

The portfolio piece exists to make this conversation possible. You're not competing with Notta on features — you're competing on customization, integration, and self-hosted privacy. SMBs hate sending meeting audio to American SaaS providers.

Build accordingly.

---

## Two-day schedule

**Saturday (~8 hrs):**
- Hours 1–2: Next.js scaffold, file upload UI, ffmpeg conversion working end-to-end on a 5-min test file
- Hours 3–5: Chunking logic with silence detection, Whisper transcription on chunks, transcript concatenation
- Hours 6–8: Term dictionary input → Whisper prompt parameter, test on a 30-min meeting

**Sunday (~8 hrs):**
- Hours 1–3: Context form (attendees, agenda, terms), Claude tool-use call with schema, end-to-end pipeline returning JSON
- Hours 4–5: Render structured 議事録 in UI as Markdown preview
- Hours 6–7: docx export with Japanese fonts, test by opening in Word
- Hour 8: Deploy to Vercel, record demo video, ship

**Hard rule:** at hour 16, whatever exists ships. Bug in chunk concatenation? Ship it. Word export rendering ugly? Ship it. README half-done? Ship it. The act of shipping rewires you. Iterate next weekend.

---

## Stretch goals (only if hours 14–16 are clear)

- Email export (`nodemailer` + Gmail SMTP, 30 min)
- Save/load template (localStorage, no DB needed, 30 min)
- Markdown live edit before export (1 hr)

If you're tempted to add anything else, stop. That's the perfectionism speaking.