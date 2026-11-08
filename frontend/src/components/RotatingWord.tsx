"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

const HOLD_MS = 2600; // how long each word stays still
const FLIP_MS = 700; // length of the vertical flip (keep in sync with --rw-flip in globals.css)

/**
 * The highlighted word in the hero headline. Every few seconds it flips vertically: the current word
 * rotates away on the X axis while the next one rotates in, and the purple box eases to the new width.
 *
 * The server renders only the first word, so crawlers always read "We Create Designs that Drive…".
 * The cycling starts after hydration, and not at all when the visitor prefers reduced motion.
 */
export function RotatingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLSpanElement>(null);
  const current = useRef(0);
  const widths = useRef<number[]>([]); // each word's width in em, so it scales with the heading

  // Advance on a timer; skip ticks while the tab is hidden so flips don't pile up.
  useEffect(() => {
    if (reducedMotion || words.length < 2) return;
    let flipTimer: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const from = current.current;
      const to = (from + 1) % words.length;
      current.current = to;
      setLeaving(from);
      setIndex(to);
      flipTimer = setTimeout(() => setLeaving(null), FLIP_MS);
    }, HOLD_MS + FLIP_MS);
    return () => {
      clearInterval(id);
      clearTimeout(flipTimer);
    };
  }, [reducedMotion, words.length]);

  // Measure every word once the web font is ready. Setting the stage's width directly (no React state)
  // lets CSS animate the box from one word's width to the next.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || words.length < 2) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const fontSize = parseFloat(getComputedStyle(stage).fontSize);
      widths.current = words.map((word) => {
        // A throwaway copy styled like the real words; removed again straight away.
        const probe = document.createElement("span");
        probe.className = "rw-word";
        probe.style.cssText = "position:absolute;visibility:hidden;left:0;top:0";
        probe.textContent = word;
        stage.appendChild(probe);
        const width = probe.getBoundingClientRect().width;
        stage.removeChild(probe);
        return width / fontSize;
      });
      stage.style.width = `${widths.current[current.current]}em`;
    });
    return () => {
      cancelled = true;
    };
  }, [words]);

  useEffect(() => {
    const width = widths.current[index];
    if (width && stageRef.current) stageRef.current.style.width = `${width}em`;
  }, [index]);

  return (
    <span ref={stageRef} className="rw-stage">
      {leaving !== null && (
        <span key={`out-${leaving}`} className="rw-word is-leaving" aria-hidden="true">
          {words[leaving]}
        </span>
      )}
      <span key={`in-${index}`} className={`rw-word${leaving !== null ? " is-entering" : ""}`}>
        {words[index]}
      </span>
    </span>
  );
}
