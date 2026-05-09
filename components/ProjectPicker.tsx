"use client";

import { useState } from "react";
import Icon from "./Icon";
import { useToast } from "./ToastProvider";
import { useProjectsList } from "@/hooks/use-projects";
import type { ContextFormState } from "@/lib/defaults";
import type { ProjectRecord } from "@/lib/db";

type Props = {
  ctx: ContextFormState;
  selectedProjectId: string | null;
  onSelect: (project: ProjectRecord | null) => void;
};

export default function ProjectPicker({ ctx, selectedProjectId, onSelect }: Props) {
  const { data, loading, save, remove } = useProjectsList();
  const toast = useToast();
  const [savingNew, setSavingNew] = useState(false);
  const [newName, setNewName] = useState("");

  async function handleSelectChange(value: string) {
    if (!value) {
      onSelect(null);
      return;
    }
    const p = data.find((x) => x.id === value);
    if (p) onSelect(p);
  }

  async function saveAsNew() {
    const name = newName.trim();
    if (!name) {
      toast.show("プロジェクト名を入力してください", "error");
      return;
    }
    try {
      const saved = await save({
        name,
        attendees: ctx.attendees,
        terms: ctx.terms,
        place: ctx.place || undefined,
        author: ctx.author || undefined,
      });
      toast.show(`プロジェクト「${saved.name}」を保存しました`, "ok");
      onSelect(saved);
      setSavingNew(false);
      setNewName("");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "保存に失敗しました", "error");
    }
  }

  async function handleDelete() {
    if (!selectedProjectId) return;
    const p = data.find((x) => x.id === selectedProjectId);
    if (!p) return;
    if (!window.confirm(`プロジェクト「${p.name}」を削除しますか？`)) return;
    try {
      await remove(selectedProjectId);
      onSelect(null);
      toast.show("プロジェクトを削除しました", "ok");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "削除に失敗しました", "error");
    }
  }

  return (
    <div className="project-picker">
      <div className="project-picker-row">
        <Icon name="folder" size={13} />
        <select
          className="project-select"
          value={selectedProjectId ?? ""}
          onChange={(e) => handleSelectChange(e.target.value)}
          disabled={loading}
        >
          <option value="">— プロジェクトを選択（任意） —</option>
          {data.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {!savingNew && (
          <button className="btn btn-sm" onClick={() => setSavingNew(true)} type="button">
            <Icon name="save" size={12} />
            現在の入力を保存
          </button>
        )}
        {selectedProjectId && (
          <button
            className="btn btn-sm btn-ghost"
            onClick={handleDelete}
            type="button"
            title="このプロジェクトを削除"
            aria-label="プロジェクトを削除"
          >
            <Icon name="trash" size={12} />
          </button>
        )}
      </div>
      {savingNew && (
        <div className="project-picker-row" style={{ marginTop: 8 }}>
          <input
            className="input"
            placeholder="プロジェクト名（例：商品企画部 定例）"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveAsNew();
              if (e.key === "Escape") {
                setSavingNew(false);
                setNewName("");
              }
            }}
            autoFocus
          />
          <button className="btn btn-sm btn-primary" onClick={saveAsNew} type="button">
            保存
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setSavingNew(false);
              setNewName("");
            }}
            type="button"
          >
            キャンセル
          </button>
        </div>
      )}
    </div>
  );
}
