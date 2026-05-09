import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Gijiroku, MeetingContext } from "../types";
import { TOOL_NAME, gijirokuTool, toolPayloadToGijiroku, type ToolPayload } from "./schema";

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";
const MAX_TOKENS = 8192;

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

let _systemPromptCache: string | null = null;
async function loadSystemPrompt(): Promise<string> {
  if (_systemPromptCache) return _systemPromptCache;
  const filePath = path.join(process.cwd(), "lib", "prompts", "gijiroku-system.txt");
  _systemPromptCache = await readFile(filePath, "utf-8");
  return _systemPromptCache;
}

function buildUserMessage(transcript: string, context: MeetingContext): string {
  const sections: string[] = [];

  sections.push("【会議の文脈情報】");
  if (context.会議名) sections.push(`会議名：${context.会議名}`);
  if (context.開催日時) sections.push(`開催日時：${context.開催日時}`);
  if (context.場所) sections.push(`場所：${context.場所}`);
  if (context.出席者?.length)
    sections.push(`出席者：\n${context.出席者.map((a) => `  - ${a}`).join("\n")}`);
  if (context.欠席者?.length)
    sections.push(`欠席者：\n${context.欠席者.map((a) => `  - ${a}`).join("\n")}`);
  if (context.議事録作成者) sections.push(`議事録作成者：${context.議事録作成者}`);
  if (context.議題?.length)
    sections.push(`予定議題：\n${context.議題.map((a) => `  - ${a}`).join("\n")}`);
  if (context.用語辞書?.length)
    sections.push(
      `専門用語辞書（正確な表記に統一すること）：\n${context.用語辞書.map((a) => `  - ${a}`).join("\n")}`
    );

  sections.push("\n【会議の文字起こし】");
  sections.push(transcript);

  sections.push(
    `\n上記の文字起こしと文脈情報をもとに、${TOOL_NAME} ツールを使用して標準的な日本のビジネス議事録を作成してください。`
  );

  return sections.join("\n");
}

function todayJp(): string {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export async function generateGijiroku(
  transcript: string,
  context: MeetingContext
): Promise<Gijiroku> {
  const systemPrompt = await loadSystemPrompt();
  const userMessage = buildUserMessage(transcript, context);

  const response = await client().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    tools: [gijirokuTool],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use block");
  }

  const payload = toolUse.input as ToolPayload;
  return toolPayloadToGijiroku(payload, todayJp());
}
