export type MeetingContext = {
  会議名?: string;
  開催日時?: string;
  場所?: string;
  出席者?: string[];
  欠席者?: string[];
  議事録作成者?: string;
  議題?: string[];
  用語辞書?: string[];
};

export type DiscussionItem = {
  議題: string;
  提案_論点?: string;
  議論経緯?: string;
  結論: string;
};

export type TodoItem = {
  担当者: string;
  内容: string;
  期限?: string;
};

export type NextMeeting = {
  日時?: string;
  議題?: string[];
};

export type Gijiroku = {
  会議名: string;
  作成日: string;
  開催日時: string;
  場所?: string;
  出席者: string[];
  欠席者?: string[];
  議事録作成者?: string;
  議題: string[];
  決定事項: string[];
  議論内容: DiscussionItem[];
  ToDo: TodoItem[];
  保留懸案事項?: string[];
  次回会議?: NextMeeting;
};

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

export type TranscriptChunk = {
  index: number;
  startSec: number;
  endSec: number;
  text: string;
  segments: TranscriptSegment[];
};

export type Transcript = {
  fullText: string;
  chunks: TranscriptChunk[];
  durationSec: number;
};
