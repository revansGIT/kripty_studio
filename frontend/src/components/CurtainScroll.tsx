"use client";

import { useEffect } from "react";

/**
 * Drives the "curtain" effect: as the visitor scrolls the first screen, the dark panel rises over the hero.
 *
 * It only writes one CSS variable, --curtain (0 at the top of the page, 1 once the panel has fully arrived);
 * all the visuals live in globals.css (.curtain-hero / .curtain-panel). One write per animation frame,
 * and nothing at all for visitors who prefer reduced motion.
 */
export function CurtainScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const hero = document.querySelector<HTMLElement>("[data-curtain-hero]");
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let range = 1; // scroll distance until the panel reaches the top of the screen (set by measure)
    let frame = 0;

    const measure = () => {
      range = Math.max(1, hero.offsetHeight);
      root.style.setProperty("--hero-pin", `${Math.min(0, window.innerHeight - hero.offsetHeight)}px`);
    };

    const update = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, window.scrollY / range));
      root.style.setProperty("--curtain", progress.toFixed(4));
      // GPU hint only while the effect is running
      root.dataset.curtain = progress < 1 ? "active" : "done";
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      update();
    };

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
      root.style.removeProperty("--curtain");
      root.style.removeProperty("--hero-pin");
      delete root.dataset.curtain;
    };
  }, []);

  return null;
}
