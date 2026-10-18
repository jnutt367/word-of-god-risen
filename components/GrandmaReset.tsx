"use client";

import { useEffect, useLayoutEffect } from "react";

/** Jason's "Grandma test" reset. Opening any page with ?grandma=1
 * makes the app forget it ever met this browser — Teddy-wise only:
 * the chapter helper note, the homepage welcome notes, and the
 * welcome's session note are cleared, and the page reloads clean
 * (same address, parameter gone) so every first-time moment can be
 * tested again, as Grandma would meet it. Reading progress, text
 * size, translation, Lamp and voice preferences are NEVER touched —
 * this resets "have I met Teddy," nothing else. */
const RESET_LOCAL_KEYS = [
  "wogr_teddy_helper_v1",
  "wogr_teddy_welcomed_v1",
  "wogr_teddy_welcome_v2",
] as const;

const RESET_SESSION_KEYS = ["wogr_teddy_welcome_session_v2"] as const;

/** Layout effect on the client (plain effect during SSR): the keys
 * are cleared before any passive effect can read them, and the
 * reload makes the fresh state deterministic — no races. */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function GrandmaReset() {
  useIsomorphicLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("grandma") !== "1") return;
    try {
      for (const key of RESET_LOCAL_KEYS) localStorage.removeItem(key);
      for (const key of RESET_SESSION_KEYS) sessionStorage.removeItem(key);
    } catch {
      /* storage unavailable — nothing to reset */
    }
    params.delete("grandma");
    const query = params.toString();
    const url =
      window.location.pathname +
      (query ? `?${query}` : "") +
      window.location.hash;
    window.location.replace(url);
  }, []);

  return null;
}
