"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import ContextForm from "@/components/ContextForm";
import CreatePasswordModal from "@/components/CreatePasswordModal";
import ExportModal from "@/components/ExportModal";
import FootBar from "@/components/FootBar";
import Icon from "@/components/Icon";
import PreviewScreen from "@/components/PreviewScreen";
import ProgressScreen from "@/components/ProgressScreen";
import Stepper from "@/components/Stepper";
import UploadScreen, { type UploadedFile } from "@/components/UploadScreen";
import { useCreateAuth } from "@/hooks/use-create-auth";
import { usePipeline } from "@/hooks/use-pipeline";
import { useTheme } from "@/hooks/use-theme";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import type { ProjectRecord } from "@/lib/db";
import { EMPTY_CTX, SAMPLE_CTX, type ContextFormState } from "@/lib/defaults";
import {
  contextFormToMeetingContext,
  linesToArray,
  parseAttendees,
} from "@/lib/parse";
import type { Gijiroku } from "@/lib/types";

export default function Page() {
  const theme = useTheme();
  const pipeline = usePipeline();
  const auth = useCreateAuth();

  const [step, setStep] = useState(0);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [ctx, setCtx] = useState<ContextFormState>(EMPTY_CTX);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editedGijiroku, setEditedGijiroku] = useState<Gijiroku | null>(null);
  const [showExport, setShowExport] = useState(false);

  const autosave = useWizardAutosave({
    pipelineState: pipeline.state,
    step,
    ctx,
    uploaded,
    selectedProjectId,
    editedGijiroku,
    onFirstSave: (g) => {
      setEditedGijiroku(g);
      setStep(3);
    },
  });

  function goToStep(i: number) {
    if (i === 2 && (!uploaded || pipeline.state.status === "running")) return;
    if (i === 3 && pipeline.state.status !== "done") return;
    setStep(i);
  }

  async function startPipeline() {
    if (!uploaded) return;
    autosave.reset();
    setStep(2);
    await pipeline.run(uploaded.file, contextFormToMeetingContext(ctx));
  }

  function cancelPipeline() {
    pipeline.cancel();
    setStep(1);
  }

  function handleProjectSelect(project: ProjectRecord | null) {
    setSelectedProjectId(project?.id ?? null);
    if (project) {
      setCtx((c) => ({
        ...c,
        attendees: project.attendees,
        terms: project.terms,
        place: project.place ?? c.place,
        author: project.author ?? c.author,
      }));
    }
  }

  const attendeeCount = parseAttendees(ctx.attendees).length;
  const termCount = linesToArray(ctx.terms).length;
  const agendaCount = linesToArray(ctx.agenda).length;

  return (
    <AppShell>
      <Stepper current={step} onStepClick={goToStep} />

      <main className="canvas">
        {step === 0 && <UploadScreen uploaded={uploaded} onSelect={setUploaded} />}
        {step === 1 && (
          <ContextForm
            ctx={ctx}
            onChange={setCtx}
            onLoadSample={() => setCtx(SAMPLE_CTX)}
            selectedProjectId={selectedProjectId}
            onProjectSelect={handleProjectSelect}
          />
        )}
        {step === 2 && (
          <ProgressScreen
            phase={pipeline.state.phase}
            progress={pipeline.state.progress}
            logs={pipeline.state.logs}
            error={pipeline.state.error}
            onCancel={cancelPipeline}
          />
        )}
        {step === 3 && editedGijiroku && pipeline.state.result && (
          <PreviewScreen
            gijiroku={editedGijiroku}
            onChange={setEditedGijiroku}
            transcript={pipeline.state.result.transcript}
            audioUrl={uploaded?.url ?? null}
            layout={theme.layout}
            onLayoutChange={(l) => theme.set("layout", l)}
            onExport={() => setShowExport(true)}
          />
        )}
      </main>

      {step < 2 && (
        <FootBar
          info={
            step === 0 ? (
              uploaded ? (
                <>準備完了 — 次へ進んで会議の前提情報を入力してください</>
              ) : (
                <>音声ファイルをアップロードしてください</>
              )
            ) : (
              <>
                入力済み — <b>{attendeeCount}名の出席者</b> · <b>{termCount}件の用語</b> ·{" "}
                <b>{agendaCount}件の議題</b>
              </>
            )
          }
          actions={
            <>
              {step > 0 && (
                <button className="btn" onClick={() => setStep(step - 1)} type="button">
                  <Icon name="back" size={13} /> 戻る
                </button>
              )}
              {step === 0 && (
                <button
                  className="btn btn-lg btn-primary"
                  disabled={!uploaded}
                  onClick={() => setStep(1)}
                  type="button"
                >
                  次へ <Icon name="arrow" size={14} />
                </button>
              )}
              {step === 1 && (
                <button
                  className="btn btn-lg btn-primary"
                  disabled={!uploaded}
                  onClick={() => auth.requireAuth(() => startPipeline())}
                  type="button"
                >
                  <Icon name="sparkle" size={13} /> 議事録を生成
                </button>
              )}
            </>
          }
        />
      )}

      {step === 2 && (
        <FootBar
          info={
            pipeline.state.error ? (
              <>処理に失敗しました</>
            ) : (
              <>
                所要時間：通常 3〜4分 ·{" "}
                <span className="mono">{pipeline.state.progress.toFixed(0)}%</span> 完了
              </>
            )
          }
        />
      )}

      {showExport && editedGijiroku && (
        <ExportModal gijiroku={editedGijiroku} onClose={() => setShowExport(false)} />
      )}

      <CreatePasswordModal
        open={auth.showModal}
        onClose={auth.closeModal}
        onSuccess={auth.onAuthSuccess}
      />
    </AppShell>
  );
}
