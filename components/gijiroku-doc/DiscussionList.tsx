"use client";

import Editable from "../Editable";
import type { DiscussionItem } from "@/lib/types";

type Props = {
  items: DiscussionItem[];
  editing: boolean;
  onChange: (items: DiscussionItem[]) => void;
};

export default function DiscussionList({ items, editing, onChange }: Props) {
  const update = (i: number, patch: Partial<DiscussionItem>) => {
    const next = items.map((d, idx) => (idx === i ? { ...d, ...patch } : d));
    onChange(next);
  };

  return (
    <>
      {items.map((d, i) => (
        <div className="gj-disc" key={i}>
          <h3>
            <span className="gnum">{i + 1}</span>
            <Editable
              as="span"
              value={d.議題}
              editing={editing}
              onChange={(v) => update(i, { 議題: v })}
            />
          </h3>
          <dl>
            {d.提案_論点 && (
              <div className="gj-disc-row">
                <dt>提案・論点</dt>
                <Editable
                  as="dd"
                  value={d.提案_論点}
                  editing={editing}
                  onChange={(v) => update(i, { 提案_論点: v })}
                />
              </div>
            )}
            {d.議論経緯 && (
              <div className="gj-disc-row">
                <dt>議論の経緯</dt>
                <Editable
                  as="dd"
                  value={d.議論経緯}
                  editing={editing}
                  onChange={(v) => update(i, { 議論経緯: v })}
                />
              </div>
            )}
            <div className="gj-disc-row">
              <dt>結論</dt>
              <Editable
                as="dd"
                value={d.結論}
                editing={editing}
                onChange={(v) => update(i, { 結論: v })}
              />
            </div>
          </dl>
        </div>
      ))}
    </>
  );
}
