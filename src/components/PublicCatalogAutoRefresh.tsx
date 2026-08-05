"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 60_000;
const MINIMUM_REFRESH_GAP_MS = 10_000;

export function PublicCatalogAutoRefresh() {
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  const refreshCatalog = useCallback(() => {
    if (document.visibilityState !== "visible") return;

    const now = Date.now();
    if (now - lastRefreshAt.current < MINIMUM_REFRESH_GAP_MS) return;

    lastRefreshAt.current = now;
    router.refresh();
  }, [router]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshCatalog();
    };
    const refreshAfterBackForwardNavigation = (event: PageTransitionEvent) => {
      if (event.persisted) refreshCatalog();
    };

    const interval = window.setInterval(refreshCatalog, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("pageshow", refreshAfterBackForwardNavigation);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("pageshow", refreshAfterBackForwardNavigation);
    };
  }, [refreshCatalog]);

  return null;
}
