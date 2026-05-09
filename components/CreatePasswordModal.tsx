"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreatePasswordModal({ open, onClose, onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    setPassword("");
    setError(null);
    setLoading(false);
    previousFocusRef.current?.focus?.();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "認証に失敗しました");
        setLoading(false);
        return;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信エラー");
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-password-title"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <h3 id="create-password-title">議事録の生成にはパスワードが必要です</h3>
          <div className="sub">
            デモ用のパスワードをお持ちの方のみご利用いただけます。閲覧は引き続き自由です。
          </div>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <input
              ref={inputRef}
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              autoComplete="current-password"
              disabled={loading}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "create-password-error" : undefined}
            />
            {error && (
              <div
                id="create-password-error"
                role="alert"
                style={{ marginTop: 8, color: "var(--warn)", fontSize: 12 }}
              >
                {error}
              </div>
            )}
          </div>
          <div className="modal-foot">
            <span className="note">入力されたパスワードはサーバーで検証され、保存されません。</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-sm"
                type="button"
                onClick={onClose}
                disabled={loading}
              >
                キャンセル
              </button>
              <button
                className="btn btn-sm btn-primary"
                type="submit"
                disabled={loading || !password}
              >
                {loading ? "認証中…" : "認証"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
