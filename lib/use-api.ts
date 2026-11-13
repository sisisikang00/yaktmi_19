"use client";
import { useCallback, useEffect, useState } from "react";
export function useApi<T>(url: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ url: string; attempt: number; data?: T; error?: string }>();
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(url!, { signal: controller.signal, cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error?.message ?? "정보를 불러오지 못했습니다.");
        if (!controller.signal.aborted) setResult({ url: url!, attempt, data: payload as T });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ url: url!, attempt, error: error instanceof Error ? error.message : "연결을 확인하고 다시 시도해주세요." });
      }
    }
    void load();
    return () => controller.abort();
  }, [url, attempt]);
  const current = result?.url === url && result.attempt === attempt ? result : undefined;
  return { data: current?.data, error: current?.error, loading: Boolean(url) && !current, retry: useCallback(() => setAttempt((value) => value + 1), []) };
}
