"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SEEN_KEY = "kripty_tg_greeting";
const SHOW_AFTER_MS = 4500; // wait before the greeting pops up
const TYPING_MS = 1500; // "typing…" dots before the message
const VISIBLE_MS = 14000; // then it tucks itself away

/**
 * Floating chat bubble in the bottom-right corner. It floats, sends out ripples, wiggles its paper plane,
 * and after a few seconds a small greeting "types" a message. Clicking either opens the Telegram chat.
 *
 * Until a Telegram link is set in the admin (Settings -> Contact links) it falls back to the contact form,
 * so it is never a dead button.
 */
export function TelegramBubble({ url }: { url: string }) {
  const [phase, setPhase] = useState<"hidden" | "typing" | "message">("hidden");
  const hasTelegram = url !== "";

  const remember = () => {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
  };
  const dismiss = () => {
    setPhase("hidden");
    remember();
  };

  // Greeting sequence, once per browser session.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY) === "1") return;
    } catch {}
    const timers = [
      setTimeout(() => setPhase("typing"), SHOW_AFTER_MS),
      setTimeout(() => setPhase("message"), SHOW_AFTER_MS + TYPING_MS),
      setTimeout(() => {
        setPhase("hidden");
        try {
          sessionStorage.setItem(SEEN_KEY, "1");
        } catch {}
      }, SHOW_AFTER_MS + TYPING_MS + VISIBLE_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Opens Telegram in a new tab; without a link it scrolls to the contact form.
  const linkProps = hasTelegram ? { href: url, target: "_blank", rel: "noopener noreferrer" } : { href: "#contact" };
  const label = hasTelegram ? "Chat with us on Telegram" : "Message us";

  return (
    <div className="tg-root fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {phase !== "hidden" && (
        <div
          role="status"
          className="tg-greeting relative w-[min(290px,calc(100vw-2rem))] rounded-[20px] rounded-br-[6px] border border-white/10 bg-[#121214]/95 p-4 pr-10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss message"
            className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-[#8c8c8c] transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
          >
            <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="m2 2 8 8M10 2 2 10" />
            </svg>
          </button>
          <a {...linkProps} onClick={remember} data-track="cta_telegram" className="block">
            <p className="mb-1 flex items-center gap-2 text-[13px] leading-none text-[#8c8c8c]">
              <i className="tg-online-dot" aria-hidden /> Kripty Studio
            </p>
            {phase === "typing" ? (
              <span className="tg-typing" role="img" aria-label="Typing">
                <i />
                <i />
                <i />
              </span>
            ) : (
              <p className="tg-message text-[15px] leading-snug">
                {hasTelegram
                  ? "Hey there! 👋 Got a project in mind? Chat with us on Telegram. We usually reply within minutes."
                  : "Hey there! 👋 Got a project in mind? Tell us about it and we'll reply within a day."}
              </p>
            )}
          </a>
        </div>
      )}

      <div className="tg-float">
        <span className="tg-ring" aria-hidden />
        <span className="tg-ring tg-ring-2" aria-hidden />
        <a
          {...linkProps}
          onClick={remember}
          aria-label={hasTelegram ? `${label} (opens in a new tab)` : label}
          data-track="cta_telegram"
          className="tg-btn group relative grid size-[58px] place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#37bbfe] sm:size-[62px]"
        >
          <span className="tg-label" aria-hidden>
            {hasTelegram ? "Chat on Telegram" : "Message us"}
          </span>
          {/* The design's Telegram glyph, turned white. */}
          <Image src="/images/social-telegram.svg" alt="" width={30} height={28} className="tg-icon relative brightness-0 invert" />
          <span className="tg-online" aria-hidden />
        </a>
      </div>
    </div>
  );
}
