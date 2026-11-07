"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppState } from "@/lib/types";

export function useAppState(week: string | null) {
  const [state, setState] = useState<AppState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const url = week ? `/api/state?week=${encodeURIComponent(week)}` : "/api/state";
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (!res.ok) {
      setError("לא ניתן לטעון את הלוח");
      setLoading(false);
      return;
    }
    setState((await res.json()) as AppState);
    setError(null);
    setLoading(false);
  }, [week]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const mutate = useCallback(
    async (body: Record<string, unknown>) => {
      setError(null);
      const res = await fetch("/api/mutate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error === "forbidden" ? "אין הרשאה" : data.error || "שגיאה");
        return null;
      }
      await reload();
      return data;
    },
    [reload],
  );

  return { state, error, loading, mutate, reload };
}
