import { siteConfig } from "./site";

// First-party analytics: an anonymous random visitor id lives in this browser's localStorage and is sent
// only to our own API. Nothing is sent when the browser signals Do Not Track / Global Privacy Control,
// or when the owner has excluded this browser (done automatically when signing in to /admin).
const KEYS = { visitor: "kripty_vid", session: "kripty_session", optOut: "kripty_no_track" };
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

type Hit = { type: "pageview" | "event" | "ping"; path?: string; name?: string; label?: string };

function uuid(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

export function isOptedOut(): boolean {
  try {
    return localStorage.getItem(KEYS.optOut) === "1";
  } catch {
    return false;
  }
}

export function setTrackingOptOut(optOut: boolean) {
  try {
    if (optOut) localStorage.setItem(KEYS.optOut, "1");
    else localStorage.removeItem(KEYS.optOut);
  } catch {}
}

export function trackingAllowed(): boolean {
  if (typeof window === "undefined" || isOptedOut()) return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack !== "1" && !nav.globalPrivacyControl;
}

/** The anonymous id for this browser (created on first use), or null if tracking is off or storage is unavailable. */
export function getVisitorId(): string | null {
  if (!trackingAllowed()) return null;
  try {
    let id = localStorage.getItem(KEYS.visitor);
    if (!id) {
      id = uuid();
      localStorage.setItem(KEYS.visitor, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** A session is shared across tabs and ends after 30 minutes without activity. */
function getSession(): string | null {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(KEYS.session);
    let s: { sid: string; last: number } | null = raw ? JSON.parse(raw) : null;
    if (!s || now - s.last > SESSION_TIMEOUT_MS) s = { sid: uuid(), last: now };
    s.last = now;
    localStorage.setItem(KEYS.session, JSON.stringify(s));
    return s.sid;
  } catch {
    return null;
  }
}

function utmFromUrl() {
  const q = new URLSearchParams(window.location.search);
  const pick = (k: string) => q.get(k)?.slice(0, 100) || undefined;
  return { source: pick("utm_source"), medium: pick("utm_medium"), campaign: pick("utm_campaign") };
}

function send(hit: Hit) {
  const vid = getVisitorId();
  const sid = vid ? getSession() : null;
  if (!vid || !sid) return;
  const body: Record<string, unknown> = { vid, sid, ...hit, path: hit.path ?? window.location.pathname };
  if (hit.type === "pageview") {
    body.referrer = document.referrer || undefined;
    // Some privacy browsers / webviews report 0x0; send a screen size only when it is real.
    const { width: w, height: h } = window.screen;
    if (w > 0 && h > 0) body.screen = { w, h };
    body.lang = navigator.language;
    body.tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    body.utm = utmFromUrl();
  }
  // keepalive lets the request finish even if the visitor navigates away right after.
  fetch(`${siteConfig.apiUrl}/api/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

let lastPageview = { path: "", at: 0 };

export function trackPageview(path: string) {
  // Ignore the duplicate effect run React strict mode causes in development.
  if (path === lastPageview.path && Date.now() - lastPageview.at < 1000) return;
  lastPageview = { path, at: Date.now() };
  send({ type: "pageview", path });
}

export const trackEvent = (name: string, label?: string, path?: string) => send({ type: "event", name, label, path });
export const trackPing = () => send({ type: "ping" });
