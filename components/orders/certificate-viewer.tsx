"use client";

import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Minus, Plus, X } from "lucide-react";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

type Point = { x: number; y: number };

/** Image that zooms with a two-finger pinch, the mouse wheel, or the +/- buttons, and pans when zoomed. */
function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ distance: number; scale: number } | null>(null);

  const zoomTo = (scale: number) =>
    setView((v) => {
      const next = clamp(scale, MIN_SCALE, MAX_SCALE);
      return next === MIN_SCALE ? { scale: 1, x: 0, y: 0 } : { ...v, scale: next };
    });

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const previous = pointers.current.get(e.pointerId);
    if (!previous) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      zoomTo(pinch.current.scale * (distance / pinch.current.distance));
    } else if (pointers.current.size === 1) {
      const dx = e.clientX - previous.x;
      const dy = e.clientY - previous.y;
      setView((v) => (v.scale > 1 ? { ...v, x: v.x + dx, y: v.y + dy } : v));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
  }

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      <div
        data-testid="certificate-canvas"
        className="flex size-full cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={(e) => zoomTo(view.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15))}
        onDoubleClick={() => zoomTo(view.scale > 1 ? 1 : 2.5)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          data-scale={view.scale.toFixed(2)}
          className="max-h-full max-w-full select-none object-contain"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        />
      </div>

      <div className="absolute bottom-[calc(max(var(--safe-bottom),10px)+16px)] left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/15 p-1 backdrop-blur">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => zoomTo(view.scale / 1.5)}
          className="flex size-10 items-center justify-center rounded-full text-white hover:bg-white/15"
        >
          <Minus className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          onClick={() => zoomTo(1)}
          className="min-w-12 px-1 text-center text-xs font-semibold text-white"
        >
          {Math.round(view.scale * 100)}%
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => zoomTo(view.scale * 1.5)}
          className="flex size-10 items-center justify-center rounded-full text-white hover:bg-white/15"
        >
          <Plus className="size-5" />
        </button>
      </div>
    </div>
  );
}

/** Full-screen viewer for the buyer-safe copy of a certificate. */
export function CertificateViewer({
  open,
  onOpenChange,
  src,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  title: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1400] bg-black" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[1401] flex flex-col bg-black focus:outline-none"
        >
          <div className="flex items-center gap-3 px-4 pb-3 pt-[calc(var(--safe-top)+12px)]">
            <Dialog.Title className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{title}</Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          {open ? <ZoomableImage src={src} alt={title} /> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
