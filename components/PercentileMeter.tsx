"use client";
import { useEffect, useState } from "react";

// Qualitative band for the percentile — this is what makes the component feel
// emotionally rewarding: the higher you type, the better the verdict reads.
function verdict(v: number) {
  if (v >= 99.5) return { tag: "Outlier", note: "Top of the state", tone: "text-acid" };
  if (v >= 99) return { tag: "Elite", note: "Among the very best", tone: "text-acid" };
  if (v >= 97) return { tag: "Exceptional", note: "Top engineering colleges in reach", tone: "text-mint" };
  if (v >= 93) return { tag: "Excellent", note: "Strong shot at premier colleges", tone: "text-mint" };
  if (v >= 85) return { tag: "Strong", note: "Solid, well-regarded options", tone: "text-sky" };
  if (v >= 70) return { tag: "Solid", note: "Plenty of good colleges open", tone: "text-sky" };
  if (v >= 50) return { tag: "Fair", note: "Focus widens your matches", tone: "text-ink/70" };
  return { tag: "Building", note: "Every seat counts — let's find them", tone: "text-ink/70" };
}

const fmtTop = (top: number) =>
  top <= 0 ? "0" : top < 1 ? top.toFixed(2) : top < 10 ? top.toFixed(1) : Math.round(top).toString();

export default function PercentileMeter({ value }: { value: number | null }) {
  const has = value != null && isFinite(value) && value >= 0 && value <= 100;
  const v = has ? value! : 0;
  const [fill, setFill] = useState(0); // animated displayed value

  useEffect(() => {
    // animate from current to target on next frame so width transitions
    const id = requestAnimationFrame(() => setFill(v));
    return () => cancelAnimationFrame(id);
  }, [v]);

  const top = 100 - v;
  const vd = verdict(v);

  return (
    <div aria-hidden={!has}>
      {/* Verdict line */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-h-[2.5rem]">
          {has ? (
            <>
              <div className="font-display text-lg uppercase leading-none tracking-tight sm:text-xl">
                Top <span className="bg-acid px-1">{fmtTop(top)}%</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-ink/55">
                Ahead of {v.toFixed(2)}% of CET students
              </div>
            </>
          ) : (
            <div className="font-display text-lg uppercase leading-none tracking-tight text-ink/35 sm:text-xl">
              Top —%
            </div>
          )}
        </div>
        {has && (
          <span className="shrink-0 border-3 border-ink bg-ink px-2.5 py-1 font-display text-[11px] uppercase tracking-wider text-paper shadow-hardsm animate-popIn">
            <span className={vd.tone}>●</span> {vd.tag}
          </span>
        )}
      </div>

      {/* The meter */}
      <div className="relative mt-3">
        {/* marker flag (sits above the track) */}
        {has && (
          <div
            className="pointer-events-none absolute -top-0 z-10 -translate-x-1/2 transition-[left] duration-700 ease-out"
            style={{ left: `${fill}%` }}
          >
            <div className="relative -translate-y-[2px]">
              <div className="h-4 w-4 rotate-45 border-3 border-ink bg-acid shadow-glow" />
            </div>
          </div>
        )}

        {/* track: full fixed gradient, a cover recedes to reveal it */}
        <div
          className="relative mt-3 h-5 overflow-hidden border-3 border-ink"
          style={{ background: "linear-gradient(90deg,#D7FF3E 0%,#00D68F 55%,#3D7BFF 100%)" }}
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={has ? Number(v.toFixed(2)) : undefined}
          aria-label="Your percentile"
        >
          {/* subtle diagonal sheen on the filled gradient */}
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
            style={{
              width: `${fill}%`,
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(255,255,255,.18) 0 8px, transparent 8px 16px)",
            }}
          />
          {/* receding cover over the unfilled portion */}
          <div
            className="absolute inset-y-0 right-0 border-l-3 border-ink bg-cloud transition-[width] duration-700 ease-out"
            style={{ width: `${100 - fill}%` }}
          />
        </div>

        {/* scale ticks */}
        <div className="mt-1.5 flex justify-between text-[10px] font-bold uppercase tracking-widest text-ink/40">
          <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
        </div>

        {has && (
          <div className={`mt-1 text-xs font-semibold ${vd.tone === "text-ink/70" ? "text-ink/60" : vd.tone}`}>
            {vd.note}
          </div>
        )}
      </div>
    </div>
  );
}
