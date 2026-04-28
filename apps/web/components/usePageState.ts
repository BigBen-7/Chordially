"use client";

import { useState, useEffect } from "react";

export type PageStatus = "idle" | "loading" | "empty" | "offline" | "error";

interface UsePageStateOptions<T> {
  fetch: () => Promise<T[]>;
}

interface UsePageStateResult<T> {
  data: T[];
  status: PageStatus;
  error: string | null;
  retry: () => void;
}

export function usePageState<T>({ fetch }: UsePageStateOptions<T>): UsePageStateResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<PageStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setError(null);

    fetch()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus(result.length === 0 ? "empty" : "idle");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unexpected error");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [tick]); // fetch is stable (passed from outside); tick is the only trigger

  // Listen for online/offline transitions
  useEffect(() => {
    const goOnline = () => setTick((t) => t + 1);
    const goOffline = () => setStatus("offline");
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return { data, status, error, retry: () => setTick((t) => t + 1) };
}
