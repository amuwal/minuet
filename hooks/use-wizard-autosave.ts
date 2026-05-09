"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import type { UploadedFile } from "@/components/UploadScreen";
import type { PipelineState } from "@/hooks/use-pipeline";
import { saveAudio, saveMeeting } from "@/lib/db";
import type { ContextFormState } from "@/lib/defaults";
import type { Gijiroku, Transcript } from "@/lib/types";

const SAVE_DEBOUNCE_MS = 800;
const EMPTY_TRANSCRIPT: Transcript = { fullText: "", chunks: [], durationSec: 0 };

type Args = {
  pipelineState: PipelineState;
  step: number;
  ctx: ContextFormState;
  uploaded: UploadedFile | null;
  selectedProjectId: string | null;
  editedGijiroku: Gijiroku | null;
  onFirstSave: (gijiroku: Gijiroku) => void;
};

export function useWizardAutosave({
  pipelineState,
  step,
  ctx,
  uploaded,
  selectedProjectId,
  editedGijiroku,
  onFirstSave,
}: Args) {
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const savedOnceRef = useRef(false);
  const toast = useToast();

  useEffect(() => {
    if (
      pipelineState.status !== "done" ||
      step !== 2 ||
      !pipelineState.result ||
      savedOnceRef.current
    ) {
      return;
    }
    savedOnceRef.current = true;
    const { gijiroku, transcript } = pipelineState.result;
    onFirstSave(gijiroku);

    void (async () => {
      try {
        const saved = await saveMeeting({
          projectId: selectedProjectId ?? undefined,
          title: gijiroku.会議名,
          datetime: gijiroku.開催日時,
          gijiroku,
          transcript,
          contextSnapshot: ctx,
          audioFilename: uploaded?.file.name,
          hasAudio: false,
        });
        setMeetingId(saved.id);

        if (uploaded) {
          try {
            await saveAudio(saved.id, uploaded.file, uploaded.file.name);
            await saveMeeting({ ...saved, hasAudio: true });
          } catch {
            /* audio storage failed (quota?) — non-fatal */
          }
        }
        toast.show("履歴に保存しました", "ok");
      } catch (e) {
        toast.show(e instanceof Error ? e.message : "保存に失敗しました", "error");
      }
    })();
  }, [pipelineState, step, ctx, uploaded, selectedProjectId, toast, onFirstSave]);

  useEffect(() => {
    if (!meetingId || !editedGijiroku) return;
    const transcript = pipelineState.result?.transcript ?? EMPTY_TRANSCRIPT;
    const t = setTimeout(() => {
      void saveMeeting({
        id: meetingId,
        projectId: selectedProjectId ?? undefined,
        title: editedGijiroku.会議名,
        datetime: editedGijiroku.開催日時,
        gijiroku: editedGijiroku,
        transcript,
        contextSnapshot: ctx,
        audioFilename: uploaded?.file.name,
        hasAudio: !!uploaded,
      });
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [meetingId, editedGijiroku, ctx, uploaded, selectedProjectId, pipelineState.result]);

  function reset() {
    savedOnceRef.current = false;
    setMeetingId(null);
  }

  return { meetingId, reset };
}
