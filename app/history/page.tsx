"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import HistoryItem from "@/components/HistoryItem";
import Icon from "@/components/Icon";
import { useToast } from "@/components/ToastProvider";
import { useMeetingsList } from "@/hooks/use-meetings";

export default function HistoryPage() {
  const { data, loading, error, remove } = useMeetingsList();
  const toast = useToast();

  async function handleDelete(id: string) {
    if (!window.confirm("この会議を削除しますか？")) return;
    try {
      await remove(id);
      toast.show("削除しました", "ok");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "削除に失敗しました", "error");
    }
  }

  return (
    <AppShell>
      <main className="canvas">
        <div className="canvas-inner wide">
          <div className="page-h">
            <div>
              <p className="eyebrow">履歴 — Past meetings</p>
              <h1 className="h1">これまでの議事録</h1>
              <p className="lede">
                ブラウザ内に保存されています（IndexedDB）。
                サーバーには保存されません。
              </p>
            </div>
            <Link href="/" className="btn btn-primary btn-lg">
              <Icon name="plus" size={14} />
              新規会議
            </Link>
          </div>

          {loading && (
            <div className="muted" style={{ padding: "32px 0", textAlign: "center" }}>
              読み込み中…
            </div>
          )}

          {error && !loading && (
            <div className="notice" style={{ marginTop: 14 }}>
              <div className="ico">
                <Icon name="info" size={14} />
              </div>
              <div>履歴の読み込みに失敗しました：{error}</div>
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <EmptyState
              icon="doc"
              title="まだ会議がありません"
              description="音声ファイルをアップロードして最初の議事録を作成してください。"
              action={
                <Link href="/" className="btn btn-primary">
                  <Icon name="plus" size={13} />
                  新規会議を始める
                </Link>
              }
            />
          )}

          {!loading && data.length > 0 && (
            <div className="history-list">
              {data.map((m) => (
                <HistoryItem key={m.id} meeting={m} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
