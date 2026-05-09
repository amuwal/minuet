"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteProject as dbDeleteProject,
  listProjects,
  saveProject as dbSaveProject,
  type ProjectRecord,
} from "@/lib/db";

type SaveInput = Omit<ProjectRecord, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export function useProjectsList() {
  const [data, setData] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setData(await listProjects());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(async (input: SaveInput) => {
    const saved = await dbSaveProject(input);
    setData((prev) => {
      const without = prev.filter((p) => p.id !== saved.id);
      return [saved, ...without].sort((a, b) => b.updatedAt - a.updatedAt);
    });
    return saved;
  }, []);

  const remove = useCallback(async (id: string) => {
    await dbDeleteProject(id);
    setData((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { data, loading, error, refresh, save, remove };
}
