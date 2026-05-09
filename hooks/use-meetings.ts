"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteMeeting as dbDeleteMeeting,
  listMeetings,
  type MeetingRecord,
} from "@/lib/db";

export type MeetingsListState = {
  data: MeetingRecord[];
  loading: boolean;
  error: string | null;
};

export function useMeetingsList() {
  const [state, setState] = useState<MeetingsListState>({
    data: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      setState((p) => ({ ...p, loading: true }));
      const data = await listMeetings();
      setState({ data, loading: false, error: null });
    } catch (e) {
      setState({
        data: [],
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await dbDeleteMeeting(id);
    setState((p) => ({ ...p, data: p.data.filter((m) => m.id !== id) }));
  }, []);

  return { ...state, refresh, remove };
}
