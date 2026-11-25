"use client";

import { useEffect } from "react";

/**
 * MotionReveal — the app's one scroll-reveal engine.
 *
 * Elements marked with `data-reveal` fade/slide in the first time
 * they enter the viewport. The hidden starting state is applied by
 * CSS only under `html.motion`, and this component adds that class
 * solely after confirming the environment can honor it:
 *   - IntersectionObserver is available, and
 *   - the reader has not requested reduced motion.
 * Otherwise the class is never added and every element stays fully
 * visible — content never depends on animation to appear.
 *
 * A MutationObserver picks up `data-reveal` elements added later by
 * client-side navigation or dynamic content.
 */
export default function MotionReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    root.classList.add("motion");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -4% 0px" },
    );

    const watch = (scope: ParentNode) => {
      scope
        .querySelectorAll("[data-reveal]:not(.in)")
        .forEach((el) => io.observe(el));
    };
    watch(document);

    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            if (node.matches("[data-reveal]")) io.observe(node);
            watch(node);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      root.classList.remove("motion");
    };
  }, []);

  return null;
}
