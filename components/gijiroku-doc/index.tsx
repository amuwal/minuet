"use client";

import Editable from "../Editable";
import DiscussionList from "./DiscussionList";
import Meta from "./Meta";
import TodoTable from "./TodoTable";
import type { Gijiroku } from "@/lib/types";

type Props = {
  gijiroku: Gijiroku;
  onChange: (next: Gijiroku) => void;
  editing: boolean;
};

const setListItem = <T,>(arr: T[], i: number, v: T): T[] =>
  arr.map((x, idx) => (idx === i ? v : x));

const splitTerms = (v: string): string[] =>
  v
    .split(/[、,]/)
    .map((s) => s.trim())
    .filter(Boolean);

export default function GijirokuDoc({ gijiroku: g, onChange, editing }: Props) {
  const set = <K extends keyof Gijiroku>(key: K, value: Gijiroku[K]) =>
    onChange({ ...g, [key]: value });

  return (
    <div className="gj-doc" data-edit={editing ? "" : undefined}>
      <Editable
        as="h1"
        className="gj-title"
        value={g.会議名}
        editing={editing}
        onChange={(v) => set("会議名", v)}
      />
      <div className="gj-sub">作成日：{g.作成日} · 議事録 v1.0</div>

      <Meta g={g} editing={editing} onChange={onChange} />

      {g.議題.length > 0 && (
        <section className="gj-section">
          <h2 className="gj-h2">
            議題 <span className="gj-h2-sub">Agenda · {g.議題.length}件</span>
          </h2>
          <ol className="gj-list">
            {g.議題.map((a, i) => (
              <Editable
                key={i}
                as="li"
                value={a}
                editing={editing}
                onChange={(v) => set("議題", setListItem(g.議題, i, v))}
              />
            ))}
          </ol>
        </section>
      )}

      {g.決定事項.length > 0 && (
        <section className="gj-section">
          <h2 className="gj-h2">
            決定事項 <span className="gj-h2-sub">Decisions · {g.決定事項.length}件</span>
          </h2>
          <ol className="gj-list">
            {g.決定事項.map((d, i) => (
              <Editable
                key={i}
                as="li"
                value={d}
                editing={editing}
                onChange={(v) => set("決定事項", setListItem(g.決定事項, i, v))}
              />
            ))}
          </ol>
        </section>
      )}

      {g.議論内容.length > 0 && (
        <section className="gj-section">
          <h2 className="gj-h2">
            議論内容 <span className="gj-h2-sub">Discussion</span>
          </h2>
          <DiscussionList
            items={g.議論内容}
            editing={editing}
            onChange={(v) => set("議論内容", v)}
          />
        </section>
      )}

      {g.ToDo.length > 0 && (
        <section className="gj-section">
          <h2 className="gj-h2">
            ToDo <span className="gj-h2-sub">5W2H · {g.ToDo.length}件</span>
          </h2>
          <TodoTable items={g.ToDo} editing={editing} onChange={(v) => set("ToDo", v)} />
        </section>
      )}

      {g.保留懸案事項 && g.保留懸案事項.length > 0 && (
        <section className="gj-section">
          <h2 className="gj-h2">
            保留・懸案事項 <span className="gj-h2-sub">Pending</span>
          </h2>
          <ul className="gj-list bullet">
            {g.保留懸案事項.map((p, i) => (
              <Editable
                key={i}
                as="li"
                value={p}
                editing={editing}
                onChange={(v) => set("保留懸案事項", setListItem(g.保留懸案事項!, i, v))}
              />
            ))}
          </ul>
        </section>
      )}

      {g.次回会議 && (g.次回会議.日時 || (g.次回会議.議題 && g.次回会議.議題.length > 0)) && (
        <section className="gj-section">
          <h2 className="gj-h2">
            次回会議 <span className="gj-h2-sub">Next</span>
          </h2>
          <dl className="gj-next">
            {g.次回会議.日時 && (
              <>
                <dt>日時</dt>
                <Editable
                  as="dd"
                  value={g.次回会議.日時}
                  editing={editing}
                  onChange={(v) => set("次回会議", { ...g.次回会議!, 日時: v })}
                />
              </>
            )}
            {g.次回会議.議題 && g.次回会議.議題.length > 0 && (
              <>
                <dt>議題</dt>
                <Editable
                  as="dd"
                  value={g.次回会議.議題.join("、")}
                  editing={editing}
                  onChange={(v) =>
                    set("次回会議", { ...g.次回会議!, 議題: splitTerms(v) })
                  }
                />
              </>
            )}
          </dl>
        </section>
      )}
    </div>
  );
}
