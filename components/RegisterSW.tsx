"use client";

import { useEffect } from "react";

/** Registers the service worker that makes the reader installable
 *  and gives it an offline shell. Production only; renders nothing. */
export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Install support is a kindness, never a requirement —
         the reader works exactly the same without it. */
    });
  }, []);
  return null;
}
