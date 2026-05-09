"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import ExportModal from "@/components/ExportModal";
import Icon from "@/components/Icon";
import PreviewScreen from "@/components/PreviewScreen";
import { useToast } from "@/components/ToastProvider";
import { useTheme } from "@/hooks/use-theme";
import {
  deleteMeeting,
  getAudio,
  getMeeting,
  saveMeeting,
  type MeetingRecord,
} from "@/lib/db";
import type { Gijiroku } from "@/lib/types";

const SAVE_DEBOUNCE_MS = 800;

export default function MeetingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const theme = useTheme();

  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const initialLoadDone = useRef(false);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const m = await getMeeting(id);
        if (cancelled) return;
        if (!m) {
          setNotFound(true);
          return;
        }
        setMeeting(m);
        if (m.hasAudio) {
          const audio = await getAudio(m.id);
          if (!cancelled && audio) {
            const url = URL.createObjectURL(audio.blob);
            audioUrlRef.current = url;
            setAudioUrl(url);
          }
        }
      } catch (e) {
        if (!cancelled) toast.show(e instanceof Error ? e.message : "読み込みに失敗しました", "error");
      } finally {
        if (!cancelled) {
          setLoading(false);
          initialLoadDone.current = true;
        }
      }
    })();
    return () => {
      cancelled = true;
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [params?.id, toast]);

  useEffect(() => {
    if (!meeting || !initialLoadDone.current) return;
    const t = setTimeout(() => {
      saveMeeting(meeting).catch((e) => {
        toast.show(e instanceof Error ? e.message : "保存に失敗しました", "error");
      });
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [meeting, toast]);

  function updateGijiroku(next: Gijiroku) {
    setMeeting((m) => (m ? { ...m, gijiroku: next, title: next.会議名, datetime: next.開催日時 } : m));
  }

  async function handleDelete() {
    if (!meeting) return;
    if (!window.confirm("この会議を削除しますか？")) return;
    try {
      await deleteMeeting(meeting.id);
      toast.show("削除しました", "ok");
      router.push("/history");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "削除に失敗しました", "error");
    }
  }

  return (
    <AppShell>
      <main className="canvas">
        {loading && (
          <div className="canvas-inner" style={{ textAlign: "center", padding: "48px 0" }}>
            <span className="muted">読み込み中…</span>
          </div>
        )}

        {!loading && notFound && (
          <div className="canvas-inner">
            <EmptyState
              icon="doc"
              title="会議が見つかりません"
              description="この議事録は削除されたか、別のブラウザで作成された可能性があります。"
              action={
                <Link href="/history" className="btn btn-primary">
                  履歴に戻る
                </Link>
              }
            />
          </div>
        )}

        {!loading && meeting && (
          <PreviewScreen
            gijiroku={meeting.gijiroku}
            onChange={updateGijiroku}
            transcript={meeting.transcript}
            audioUrl={audioUrl}
            layout={theme.layout}
            onLayoutChange={(l) => theme.set("layout", l)}
            onExport={() => setShowExport(true)}
            breadcrumb={
              <div className="meeting-breadcrumb">
                <Link href="/history" className="btn btn-sm btn-ghost">
                  <Icon name="back" size={12} />
                  履歴
                </Link>
                <button className="btn btn-sm btn-ghost" onClick={handleDelete} type="button">
                  <Icon name="trash" size={12} />
                  削除
                </button>
              </div>
            }
          />
        )}
      </main>

      {showExport && meeting && (
        <ExportModal gijiroku={meeting.gijiroku} onClose={() => setShowExport(false)} />
      )}
    </AppShell>
  );
}
