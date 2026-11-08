"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackEvent, trackPageview, trackPing, trackingAllowed } from "@/lib/tracking";

/** Mounted once in the root layout. Records page views, CTA clicks, scroll depth, section views and a heartbeat. */
export function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || !trackingAllowed()) return;

    trackPageview(pathname);

    // Each milestone is reported once per page view.
    const fired = new Set<string>();
    const once = (name: string, label: string) => {
      const key = `${name}:${label}`;
      if (fired.has(key)) return;
      fired.add(key);
      trackEvent(name, label, pathname);
    };

    // Elements opt in with data-track="event_name"; external links are reported as "outbound".
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const tracked = target?.closest?.("[data-track]") as HTMLElement | null;
      if (tracked) {
        trackEvent(tracked.dataset.track!, tracked.dataset.trackLabel ?? tracked.textContent?.trim().slice(0, 80), pathname);
        return;
      }
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (link && /^https?:/.test(link.href) && link.host !== window.location.host) {
        trackEvent("outbound", link.href.slice(0, 180), pathname);
      }
    };

    let scheduled = false;
    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        const doc = document.documentElement;
        const percent = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
        for (const mark of [25, 50, 75, 100]) if (percent >= Math.min(mark, 98)) once("scroll", String(mark));
      });
    };

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && once("section_view", (en.target as HTMLElement).id)),
      { threshold: 0.35 },
    );
    document.querySelectorAll("main section[id]").forEach((s) => observer.observe(s));

    // Heartbeat keeps "online now" and session duration accurate while the tab is visible.
    const onVisible = () => document.visibilityState === "visible" && trackPing();
    const heartbeat = setInterval(onVisible, 30_000);

    document.addEventListener("click", onClick);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearInterval(heartbeat);
      observer.disconnect();
      document.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return null;
}
