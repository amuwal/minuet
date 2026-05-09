import type { Gijiroku } from "../types";

export const TOOL_NAME = "create_gijiroku";

export const gijirokuTool = {
  name: TOOL_NAME,
  description: "標準的な日本のビジネス議事録を構造化データとして作成する。",
  input_schema: {
    type: "object" as const,
    properties: {
      meeting_name: { type: "string", description: "会議名" },
      meeting_datetime: {
        type: "string",
        description: "開催日時。西暦+24時間表記（例: 2026/05/09 14:00〜15:30）",
      },
      location: { type: "string", description: "場所（会議室名またはオンラインツール名）" },
      attendees: {
        type: "array",
        items: { type: "string" },
        description: "出席者リスト。「部署 名前」形式が望ましい",
      },
      absentees: { type: "array", items: { type: "string" }, description: "欠席者リスト" },
      recorder: { type: "string", description: "議事録作成者" },
      agenda: {
        type: "array",
        items: { type: "string" },
        description: "議題リスト",
      },
      decisions: {
        type: "array",
        items: { type: "string" },
        description: "決定事項。体言止めで記述",
      },
      discussions: {
        type: "array",
        description: "議論内容。各議題について議論の流れと結論を記載",
        items: {
          type: "object",
          properties: {
            topic: { type: "string", description: "議題タイトル" },
            proposal: { type: "string", description: "提案・論点" },
            flow: { type: "string", description: "議論の経緯" },
            conclusion: { type: "string", description: "結論または次のアクション" },
          },
          required: ["topic", "conclusion"],
        },
      },
      todos: {
        type: "array",
        description: "ToDoリスト。5W2Hを意識すること",
        items: {
          type: "object",
          properties: {
            assignee: { type: "string", description: "担当者" },
            content: { type: "string", description: "実施内容" },
            deadline: { type: "string", description: "期限。YYYY/MM/DD形式、不明な場合は「未定」" },
          },
          required: ["assignee", "content"],
        },
      },
      pending_items: {
        type: "array",
        items: { type: "string" },
        description: "保留・懸案事項",
      },
      next_meeting: {
        type: "object",
        description: "次回会議の予定",
        properties: {
          datetime: { type: "string", description: "次回開催日時" },
          agenda: { type: "array", items: { type: "string" }, description: "次回の議題" },
        },
      },
    },
    required: [
      "meeting_name",
      "meeting_datetime",
      "attendees",
      "agenda",
      "decisions",
      "discussions",
      "todos",
    ],
  },
};

export type ToolPayload = {
  meeting_name: string;
  meeting_datetime: string;
  location?: string;
  attendees: string[];
  absentees?: string[];
  recorder?: string;
  agenda: string[];
  decisions: string[];
  discussions: Array<{
    topic: string;
    proposal?: string;
    flow?: string;
    conclusion: string;
  }>;
  todos: Array<{
    assignee: string;
    content: string;
    deadline?: string;
  }>;
  pending_items?: string[];
  next_meeting?: {
    datetime?: string;
    agenda?: string[];
  };
};

export function toolPayloadToGijiroku(
  payload: ToolPayload,
  createdDate: string
): Gijiroku {
  return {
    会議名: payload.meeting_name,
    作成日: createdDate,
    開催日時: payload.meeting_datetime,
    場所: payload.location,
    出席者: payload.attendees ?? [],
    欠席者: payload.absentees,
    議事録作成者: payload.recorder,
    議題: payload.agenda ?? [],
    決定事項: payload.decisions ?? [],
    議論内容: (payload.discussions ?? []).map((d) => ({
      議題: d.topic,
      提案_論点: d.proposal,
      議論経緯: d.flow,
      結論: d.conclusion,
    })),
    ToDo: (payload.todos ?? []).map((t) => ({
      担当者: t.assignee,
      内容: t.content,
      期限: t.deadline,
    })),
    保留懸案事項: payload.pending_items,
    次回会議: payload.next_meeting
      ? { 日時: payload.next_meeting.datetime, 議題: payload.next_meeting.agenda }
      : undefined,
  };
}
