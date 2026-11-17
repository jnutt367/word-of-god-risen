"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 350;

function clampScale(s: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

function MagnifierIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
      <path d="M11 8v6M8 11h6" />
    </svg>
  );
}

interface LightboxProps {
  src: string;
  alt: string;
  name: string;
  openerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}

function ZoomLightbox({ src, alt, name, openerRef, onClose }: LightboxProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const stateRef = useRef({ scale, offset });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef<{ moved: number } | null>(null);
  const pinchRef = useRef<{ mid: { x: number; y: number }; dist: number } | null>(
    null
  );
  const downRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    stateRef.current = { scale, offset };
  }, [scale, offset]);

  /* Focus the close button on open, lock body scroll, Esc closes,
     and focus returns to the opener on unmount. */
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const opener = openerRef.current;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      (opener ?? previouslyFocused)?.focus?.();
    };
  }, [onClose, openerRef]);

  const clampOffset = useCallback((off: { x: number; y: number }, s: number) => {
    const el = frameRef.current;
    if (!el || s <= 1) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const maxX = ((s - 1) * rect.width) / 2;
    const maxY = ((s - 1) * rect.height) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, off.x)),
      y: Math.min(maxY, Math.max(-maxY, off.y)),
    };
  }, []);

  /** Zoom toward a point given in frame-centered coordinates. */
  const zoomAt = useCallback(
    (p: { x: number; y: number }, newScale: number) => {
      const cur = stateRef.current;
      const ns = clampScale(newScale);
      if (ns === cur.scale) return;
      const ratio = ns / cur.scale;
      let next = {
        x: p.x - (p.x - cur.offset.x) * ratio,
        y: p.y - (p.y - cur.offset.y) * ratio,
      };
      next = ns === 1 ? { x: 0, y: 0 } : clampOffset(next, ns);
      stateRef.current = { scale: ns, offset: next };
      setScale(ns);
      setOffset(next);
    },
    [clampOffset]
  );

  const centeredPoint = useCallback((clientX: number, clientY: number) => {
    const el = frameRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };
  }, []);

  /* Mouse-wheel zoom — native listener so the page behind never scrolls. */
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAt(
        centeredPoint(e.clientX, e.clientY),
        stateRef.current.scale * factor
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt, centeredPoint]);

  const toggleZoomAt = useCallback(
    (clientX: number, clientY: number) => {
      const cur = stateRef.current.scale;
      if (cur > 1) {
        stateRef.current = { scale: 1, offset: { x: 0, y: 0 } };
        setScale(1);
        setOffset({ x: 0, y: 0 });
      } else {
        zoomAt(centeredPoint(clientX, clientY), 2);
      }
    },
    [zoomAt, centeredPoint]
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragRef.current = { moved: 0 };
    downRef.current = { t: Date.now(), x: e.clientX, y: e.clientY };
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = {
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        dist: Math.hypot(a.x - b.x, a.y - b.y),
      };
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dragRef.current) {
      dragRef.current.moved += Math.abs(dx) + Math.abs(dy);
      if (dragRef.current.moved > 6) suppressClickRef.current = true;
    }

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [a, b] = [...pointersRef.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const cur = stateRef.current;
      const ns = clampScale(cur.scale * (dist / pinchRef.current.dist || 1));
      const ratio = ns / cur.scale;
      const mc = centeredPoint(mid.x, mid.y);
      let next = {
        x: mc.x - (mc.x - cur.offset.x) * ratio + (mid.x - pinchRef.current.mid.x),
        y: mc.y - (mc.y - cur.offset.y) * ratio + (mid.y - pinchRef.current.mid.y),
      };
      next = ns === 1 ? { x: 0, y: 0 } : clampOffset(next, ns);
      stateRef.current = { scale: ns, offset: next };
      setScale(ns);
      setOffset(next);
      pinchRef.current = { mid, dist };
      return;
    }

    if (pointersRef.current.size === 1 && stateRef.current.scale > 1) {
      const cur = stateRef.current;
      const next = clampOffset(
        { x: cur.offset.x + dx, y: cur.offset.y + dy },
        cur.scale
      );
      stateRef.current = { scale: cur.scale, offset: next };
      setOffset(next);
    }
  };

  const endPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const wasTracked = pointersRef.current.has(e.pointerId);
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;

    /* Double-tap (touch/pen): toggle 2× / reset. Mouse uses onDoubleClick. */
    if (
      wasTracked &&
      e.pointerType !== "mouse" &&
      downRef.current &&
      Date.now() - downRef.current.t < 300 &&
      Math.hypot(e.clientX - downRef.current.x, e.clientY - downRef.current.y) < 10
    ) {
      const now = Date.now();
      const last = lastTapRef.current;
      if (
        last &&
        now - last.t < DOUBLE_TAP_MS &&
        Math.hypot(e.clientX - last.x, e.clientY - last.y) < 40
      ) {
        toggleZoomAt(e.clientX, e.clientY);
        lastTapRef.current = null;
      } else {
        lastTapRef.current = { t: now, x: e.clientX, y: e.clientY };
      }
    }
    downRef.current = null;
  };

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (e.target === e.currentTarget) onClose();
  };

  const chipButton =
    "rounded-full bg-white/10 p-2.5 text-cream-50 backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 disabled:opacity-40";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Zoomed portrait of ${name}`}
      className="fixed inset-0 z-[100] bg-black/95"
      onClick={onBackdropClick}
    >
      <div
        ref={frameRef}
        className={`h-full w-full touch-none overflow-hidden ${
          scale > 1 ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={(e) => toggleZoomAt(e.clientX, e.clientY)}
      >
        <div
          className="h-full w-full"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="h-full w-full select-none object-contain"
          />
        </div>
      </div>

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className={`absolute right-4 top-4 z-10 ${chipButton}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        <button
          type="button"
          aria-label="Zoom in"
          disabled={scale >= MAX_SCALE}
          onClick={() => zoomAt({ x: 0, y: 0 }, scale * 1.5)}
          className={chipButton}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          disabled={scale <= MIN_SCALE}
          onClick={() => zoomAt({ x: 0, y: 0 }, scale / 1.5)}
          className={chipButton}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>

      <p className="pointer-events-none absolute bottom-4 left-4 z-10 max-w-[60%] text-sm text-cream-50/80">
        {name}
        <span className="mt-0.5 block text-xs text-cream-50/60">
          Pinch or scroll to zoom · Drag to look around · Double-tap to reset
        </span>
      </p>
    </div>
  );
}

interface ZoomableImageProps {
  src: string;
  alt: string;
  /** The person's name, used in aria-labels ("Zoom in on <name>"). */
  name: string;
  imgClassName?: string;
  /** Show a small "Tap to zoom" chip over the image. */
  hint?: boolean;
  loading?: "lazy" | "eager";
}

/**
 * An image that opens the fullscreen zoom viewer when clicked.
 * Used on the character detail page (portrait + variants).
 */
export default function ZoomableImage({
  src,
  alt,
  name,
  imgClassName,
  hint = false,
  loading,
}: ZoomableImageProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Zoom in on ${name}`}
        className="relative block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
      >
        <img src={src} alt={alt} className={imgClassName} loading={loading} />
        {hint ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-cream-50"
          >
            <MagnifierIcon className="h-3.5 w-3.5" />
            Tap to zoom
          </span>
        ) : null}
      </button>
      {open ? (
        <ZoomLightbox
          src={src}
          alt={alt}
          name={name}
          openerRef={triggerRef}
          onClose={close}
        />
      ) : null}
    </>
  );
}

interface ZoomOverlayButtonProps {
  src: string;
  alt: string;
  name: string;
  className?: string;
}

/**
 * A small magnifier button that opens the zoom viewer directly.
 * Used on grid cards, where the card itself is a navigation link —
 * this button never triggers that navigation.
 */
export function ZoomOverlayButton({
  src,
  alt,
  name,
  className,
}: ZoomOverlayButtonProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={`Zoom in on ${name}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`rounded-full bg-black/55 p-2 text-cream-50 opacity-90 backdrop-blur-sm transition hover:bg-black/75 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 sm:opacity-0 sm:group-hover:opacity-100 ${className ?? ""}`}
      >
        <MagnifierIcon className="h-4 w-4" />
      </button>
      {open ? (
        <ZoomLightbox
          src={src}
          alt={alt}
          name={name}
          openerRef={btnRef}
          onClose={close}
        />
      ) : null}
    </>
  );
}
