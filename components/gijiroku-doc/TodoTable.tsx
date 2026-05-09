"use client";

import Editable from "../Editable";
import type { TodoItem } from "@/lib/types";

type Props = {
  items: TodoItem[];
  editing: boolean;
  onChange: (items: TodoItem[]) => void;
};

export default function TodoTable({ items, editing, onChange }: Props) {
  const update = (i: number, patch: Partial<TodoItem>) => {
    const next = items.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    onChange(next);
  };

  return (
    <table className="gj-table">
      <thead>
        <tr>
          <th>担当者</th>
          <th>内容</th>
          <th>期限</th>
        </tr>
      </thead>
      <tbody>
        {items.map((t, i) => (
          <tr key={i}>
            <td className="who-cell">
              <span className="who-pill">
                <span className="av">{(t.担当者[0] || "?").toUpperCase()}</span>
                <Editable
                  as="span"
                  value={t.担当者}
                  editing={editing}
                  onChange={(v) => update(i, { 担当者: v })}
                />
              </span>
            </td>
            <Editable
              as="td"
              value={t.内容}
              editing={editing}
              onChange={(v) => update(i, { 内容: v })}
            />
            <Editable
              as="td"
              className="due-cell"
              value={t.期限 ?? "未定"}
              editing={editing}
              onChange={(v) => update(i, { 期限: v })}
            />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
