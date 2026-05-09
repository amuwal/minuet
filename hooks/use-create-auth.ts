"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ToastProvider";

export type CreateAuthState = {
  authed: boolean;
  showModal: boolean;
  requireAuth: (callback: () => void) => void;
  onAuthSuccess: () => void;
  closeModal: () => void;
};

export function useCreateAuth(): CreateAuthState {
  const [authed, setAuthed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const pendingRef = useRef<(() => void) | null>(null);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/create", { method: "GET", cache: "no-store" })
      .then((r) => {
        if (!cancelled) setAuthed(r.ok);
      })
      .catch(() => {
        if (!cancelled) setAuthed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const requireAuth = useCallback<CreateAuthState["requireAuth"]>(
    (callback) => {
      if (authed) {
        callback();
        return;
      }
      pendingRef.current = callback;
      setShowModal(true);
    },
    [authed]
  );

  const onAuthSuccess = useCallback(() => {
    setAuthed(true);
    setShowModal(false);
    toast.show("認証されました", "ok");
    const cb = pendingRef.current;
    pendingRef.current = null;
    if (cb) cb();
  }, [toast]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    pendingRef.current = null;
  }, []);

  return { authed, showModal, requireAuth, onAuthSuccess, closeModal };
}
