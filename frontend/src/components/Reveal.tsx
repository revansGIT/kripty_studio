"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fades its content up (with a touch of blur) the first time it scrolls into view.
 * It only flips a data attribute; the animation itself lives in globals.css (.reveal), and
 * is skipped for visitors who prefer reduced motion or have JavaScript off.
 */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.revealed = "true";
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "true";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} style={{ ["--reveal-delay" as string]: `${delay}ms` }}>
      {children}
    </div>
  );
}
