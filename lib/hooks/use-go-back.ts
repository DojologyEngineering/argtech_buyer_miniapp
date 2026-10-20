"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/** Goes back in history, or to `fallback` when the screen was opened directly. */
export function useGoBack(fallback: string) {
  const router = useRouter();
  return useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(fallback);
  }, [router, fallback]);
}
