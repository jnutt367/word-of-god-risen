"use client";

import {
  useCallback,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

/** Zoom steps: + walks up this ladder, − walks back down to 1× (reset). */
const STEPS = [1, 1.5, 2, 3, 4];

interface InlineZoomImageProps {
  src: string;
  alt: string;
  /** The person's name, used in aria-labels ("Zoom in on <name>"). */
  name: string;
  imgClassName?: string;
  /** Classes for the clipping frame (e.g. "aspect-square w-full" on grid cards). */
  frameClassName?: string;
  loading?: "lazy" | "eager";
}

/**
 * A portrait with simple inline + / − zoom, right on the image.
 * No viewer opens and there is nothing to close: + steps the zoom up,
 * − steps it back down to 1×. While zoomed, drag to pan (the frame
 * clips the overflow). Zooming is always centered — simple and
 * predictable, per Jason's ruling (Nov 17, 2026).
 */
export default function InlineZoomImage({
  src,
  alt,
  name,
  imgClassName,
  frameClassName,
  loading,
}: InlineZoomImageProps) {
  const [step, setStep] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    offX: number;
    offY: number;
    moved: number;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const scale = STEPS[step];

  const clampOffset = useCallback(
    (off: { x: number; y: number }, s: number) => {
      const el = frameRef.current;
      if (!el || s <= 1) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      const maxX = ((s - 1) * rect.width) / 2;
      const maxY = ((s - 1) * rect.height) / 2;
      return {
        x: Math.min(maxX, Math.max(-maxX, off.x)),
        y: Math.min(maxY, Math.max(-maxY, off.y)),
      };
    },
    []
  );

  const zoomIn = (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (step >= STEPS.length - 1) return;
    const next = step + 1;
    setStep(next);
    setOffset((o) => clampOffset(o, STEPS[next]));
  };

  const zoomOut = (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (step <= 0) return;
    const next = step - 1;
    setStep(next);
    setOffset((o) =>
      STEPS[next] === 1 ? { x: 0, y: 0 } : clampOffset(o, STEPS[next])
    );
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    if ((e.target as HTMLElement).closest("button")) return;
    /* Stop the browser turning this pan into a native drag (the grid
       image sits inside a link, which is draggable by default — that
       fires pointercancel and kills the pan after the first move). */
    e.preventDefault();
    frameRef.current?.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offX: offset.x,
      offY: offset.y,
      moved: 0,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    d.moved = Math.max(d.moved, Math.hypot(dx, dy));
    setOffset(clampOffset({ x: d.offX + dx, y: d.offY + dy }, scale));
  };

  const endDrag = () => {
    if (dragRef.current && dragRef.current.moved > 6) {
      suppressClickRef.current = true;
    }
    dragRef.current = null;
  };

  /* A pan-drag that ends over a surrounding link must not navigate. */
  const onClickCapture = (e: ReactMouseEvent) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  };

  const zoomButton =
    "flex h-8 w-8 items-center justify-center rounded-full border border-gold-500/40 bg-vineyard-950/85 text-lg font-semibold leading-none text-gold-300 backdrop-blur-sm transition hover:bg-vineyard-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <div
      ref={frameRef}
      className={`relative overflow-hidden ${
        scale > 1 ? "cursor-grab touch-none active:cursor-grabbing" : ""
      } ${frameClassName ?? "w-full"}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={onClickCapture}
    >
      <img
        src={src}
        alt={alt}
        loading={loading}
        draggable={false}
        className={`select-none ${imgClassName ?? "w-full"}`}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        }}
      />
      <div className="absolute bottom-2 right-2 z-10 flex gap-1.5">
        <button
          type="button"
          aria-label={`Zoom out on ${name}`}
          disabled={step === 0}
          onClick={zoomOut}
          className={zoomButton}
        >
          <span aria-hidden="true">−</span>
        </button>
        <button
          type="button"
          aria-label={`Zoom in on ${name}`}
          disabled={step === STEPS.length - 1}
          onClick={zoomIn}
          className={zoomButton}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}
