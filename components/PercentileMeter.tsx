"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const fmtTop = (top: number) =>
  top <= 0 ? "0" : top < 1 ? top.toFixed(2) : top < 10 ? top.toFixed(1) : Math.round(top).toString();

// A warm, rewarding exclamation that scales with the score.
function exclaim(v: number) {
  if (v >= 99) return "Outstanding";
  if (v >= 97) return "Brilliant";
  if (v >= 93) return "Amazing";
  if (v >= 85) return "Excellent";
  if (v >= 70) return "Great going";
  if (v >= 50) return "Good start";
  return "Keep pushing";
}

export default function PercentileMeter({
  value,
  onChange,
}: {
  value: number | null;
  onChange?: (v: number) => void;
}) {
  const has = value != null && isFinite(value) && value >= 0 && value <= 100;
  const v = has ? value! : 0;
  const interactive = typeof onChange === "function";

  const [fill, setFill] = useState(0); // animated displayed value
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // 1:1 tracking while dragging, eased animation otherwise.
  useEffect(() => {
    if (dragging) {
      setFill(v);
      return;
    }
    const id = requestAnimationFrame(() => setFill(v));
    return () => cancelAnimationFrame(id);
  }, [v, dragging]);

  const setFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || !onChange) return;
      const r = el.getBoundingClientRect();
      const pct = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
      onChange(Math.round(pct * 100) / 100);
    },
    [onChange]
  );

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => setFromClientX(e.clientX);
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragging, setFromClientX]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!onChange) return;
    const step = e.shiftKey ? 1 : 0.5;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(100, Math.round((v + step) * 100) / 100));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(0, Math.round((v - step) * 100) / 100));
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(100);
    }
  };

  const top = 100 - v;
  const active = dragging || hovering;
  const ease = dragging ? "" : "transition-[left,width] duration-700 ease-out";
  const showThumb = has || dragging;

  return (
    <div>
      {/* Track + tooltip */}
      <div className="relative pt-9">
        {/* Live tooltip riding above the thumb */}
        {showThumb && (
          <div
            className={`pointer-events-none absolute top-0 z-20 -translate-x-1/2 ${ease}`}
            style={{ left: `${fill}%` }}
          >
            <div
              className={`relative whitespace-nowrap border-3 border-ink bg-ink px-2.5 py-1 font-display text-xs tabular-nums text-paper shadow-hardsm transition-transform duration-150 ease-brut ${
                active ? "scale-105" : ""
              }`}
            >
              {v.toFixed(2)}
              <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-3 border-r-3 border-ink bg-ink" />
            </div>
          </div>
        )}

        {/* Track — rounded pill, neon gradient, light cover recedes to reveal fill */}
        <div
          ref={trackRef}
          onPointerDown={
            interactive
              ? (e) => {
                  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                  setDragging(true);
                  setFromClientX(e.clientX);
                }
              : undefined
          }
          onMouseEnter={() => interactive && setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className={`relative h-5 rounded-full border-3 border-ink ${
            interactive ? "cursor-pointer touch-none" : ""
          }`}
          style={{
            background:
              "linear-gradient(90deg,#9B5CFF 0%,#3D7BFF 34%,#00D68F 70%,#D7FF3E 100%)",
          }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-full">
            {/* diagonal sheen on the filled portion */}
            <div
              className={`absolute inset-y-0 left-0 ${ease}`}
              style={{
                width: `${fill}%`,
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(255,255,255,.22) 0 8px, transparent 8px 16px)",
              }}
            />
            {/* receding cover over the unfilled portion */}
            <div
              className={`absolute inset-y-0 right-0 bg-cloud ${ease}`}
              style={{ width: `${100 - fill}%` }}
            />
          </div>

          {/* Glowing draggable thumb */}
          {showThumb && (
            <div
              role={interactive ? "slider" : "meter"}
              tabIndex={interactive ? 0 : undefined}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Number(v.toFixed(2))}
              aria-label="Your percentile"
              onKeyDown={interactive ? onKeyDown : undefined}
              className={`absolute top-1/2 z-10 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-3 border-ink bg-white outline-none ${ease} ${
                active ? "scale-110 shadow-glow" : "shadow-hardsm"
              } ${interactive ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
              style={{ left: `${fill}%` }}
            >
              <span
                className={`block rounded-full bg-acid transition-all duration-150 ease-brut ${
                  active ? "h-3.5 w-3.5" : "h-2.5 w-2.5"
                }`}
              />
            </div>
          )}
        </div>

        {/* scale ticks */}
        <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-ink/40">
          <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
        </div>
      </div>

      {/* Insight panel */}
      {has ? (
        <div className="mt-4 flex items-start gap-3 border-3 border-ink bg-grape/[0.08] p-3 animate-popIn sm:p-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center border-2 border-ink bg-white shadow-hardsm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l5-5 4 4 8-9" />
              <path d="M21 7v5h-5" />
            </svg>
          </span>
          <p className="text-sm leading-snug text-ink/70">
            You scored higher than <b className="text-ink tabular-nums">{v.toFixed(2)}%</b> of all CET students.{" "}
            <span className="font-bold text-grape">{exclaim(v)}! You are in the top {fmtTop(top)}%</span>
          </p>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 border-3 border-dashed border-ink/25 bg-white/40 p-3 sm:p-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center border-2 border-ink/30 bg-white text-ink/40">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l5-5 4 4 8-9" /><path d="M21 7v5h-5" />
            </svg>
          </span>
          <p className="text-sm font-semibold leading-snug text-ink/40">
            Type your percentile or drag the marker to see where you rank.
          </p>
        </div>
      )}
    </div>
  );
}
