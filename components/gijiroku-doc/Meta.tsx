"use client";

import Editable from "../Editable";
import type { Gijiroku } from "@/lib/types";

type Props = {
  g: Gijiroku;
  editing: boolean;
  onChange: (next: Gijiroku) => void;
};

const splitNames = (v: string): string[] =>
  v
    .split(/[、,]/)
    .map((s) => s.trim())
    .filter(Boolean);

export default function Meta({ g, editing, onChange }: Props) {
  const set = <K extends keyof Gijiroku>(key: K, value: Gijiroku[K]) =>
    onChange({ ...g, [key]: value });

  return (
    <dl className="gj-meta">
      <dt>開催日時</dt>
      <Editable
        as="dd"
        value={g.開催日時}
        editing={editing}
        onChange={(v) => set("開催日時", v)}
      />
      {g.場所 !== undefined && (
        <>
          <dt>場所</dt>
          <Editable
            as="dd"
            value={g.場所}
            editing={editing}
            onChange={(v) => set("場所", v)}
          />
        </>
      )}
      <dt>出席者</dt>
      <Editable
        as="dd"
        value={g.出席者.join("、")}
        editing={editing}
        onChange={(v) => set("出席者", splitNames(v))}
      />
      {g.欠席者 && g.欠席者.length > 0 && (
        <>
          <dt>欠席者</dt>
          <Editable
            as="dd"
            value={g.欠席者.join("、")}
            editing={editing}
            onChange={(v) => set("欠席者", splitNames(v))}
          />
        </>
      )}
      {g.議事録作成者 && (
        <>
          <dt>作成者</dt>
          <Editable
            as="dd"
            value={g.議事録作成者}
            editing={editing}
            onChange={(v) => set("議事録作成者", v)}
          />
        </>
      )}
    </dl>
  );
}
