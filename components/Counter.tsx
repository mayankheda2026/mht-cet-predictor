"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Animated count-up. Fires once when scrolled into view (or immediately if
 * already visible). Respects prefers-reduced-motion by snapping to the value.
 */
export default function Counter({
  to,
  className,
  duration = 1100,
}: {
  to: number;
  className?: string;
  duration?: number;
}) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setN(to);
      return;
    }

    const animate = () => {
      if (done.current) return;
      done.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setN(Math.round(to * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && animate(),
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {n.toLocaleString("en-IN")}
    </span>
  );
}
