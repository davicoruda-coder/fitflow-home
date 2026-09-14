"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Pick up the media-only SW promptly after deploys
        void reg.update();
      })
      .catch(() => {
        // SW optional — install prompt may still work once manifest is valid
      });
  }, []);

  return null;
}
