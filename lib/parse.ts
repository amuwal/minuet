import type { ContextFormState } from "./defaults";
import type { MeetingContext } from "./types";

export type ParsedAttendee = {
  name: string;
  dept: string;
  initial: string;
  display: string;
};

export function parseAttendees(raw: string): ParsedAttendee[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, deptPart] = line.split("/").map((s) => s?.trim() ?? "");
      const name = namePart || line;
      const dept = deptPart || "";
      const initial = (name[0] || "?").toUpperCase();
      const display = dept ? `${dept} ${name}` : name;
      return { name, dept, initial, display };
    });
}

export function linesToArray(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function contextFormToMeetingContext(form: ContextFormState): MeetingContext {
  const attendees = parseAttendees(form.attendees).map((a) => a.display);

  return {
    会議名: form.title.trim() || undefined,
    開催日時: form.datetime.trim() || undefined,
    場所: form.place.trim() || undefined,
    議事録作成者: form.author.trim() || undefined,
    出席者: attendees.length ? attendees : undefined,
    議題: linesToArray(form.agenda),
    用語辞書: linesToArray(form.terms),
  };
}

export function nowJpTimestamp(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
