"use client";
import { useEffect } from "react";

/** Registers the PWA service worker once, on the client, after mount. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal: app still works fully online without the worker.
      });
    }
  }, []);
  return null;
}
