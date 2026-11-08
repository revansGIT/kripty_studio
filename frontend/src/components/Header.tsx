"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { siteConfig } from "@/lib/site";
import { ArrowUpRight } from "./ui";

export function Logo() {
  const pathname = usePathname();
  // Already on the home page: Next would do nothing (or leave "#faq" in the address), so scroll to the very top ourselves.
  const toTop = (e: MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    window.history.replaceState(null, "", "/");
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return (
    <Link
      href="/"
      onClick={toTop}
      aria-label={`${siteConfig.name} — home`}
      className="flex h-10 items-center text-[30px] font-bold leading-none tracking-[-1.2px] text-ink"
    >
      <span className="translate-y-[1px]">Kripty</span>
      <Image
        src="/images/logo-mascot.png"
        alt=""
        width={40}
        height={40}
        priority
        className="mx-[-1px] size-10 drop-shadow-[0_4px_15px_rgba(0,0,0,0.25)]"
      />
      <span className="translate-y-[1px]">Studio</span>
    </Link>
  );
}

export function Header({ bookingUrl = "" }: { bookingUrl?: string }) {
  const [open, setOpen] = useState(false);
  // Opens the Google Calendar booking page in a new tab; until a link is set it scrolls to the contact form instead.
  const bookProps = bookingUrl
    ? { href: bookingUrl, target: "_blank", rel: "noopener noreferrer", "aria-label": "Book a call (opens Google Calendar in a new tab)" }
    : { href: "#contact" };

  return (
    <header className="sticky top-0 z-50 bg-page/80 backdrop-blur-[3px]">
      <div className="relative mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-4 sm:px-6 2xl:px-0">
        <Logo />

        <nav aria-label="Primary" className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
          <ul className="flex items-center gap-[10px]">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="flex h-[38px] items-center rounded-[8px] p-3 text-[14px] leading-none text-ink-2 transition-colors hover:bg-ink/5"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-[10px] md:flex">
          <a {...bookProps} className="btn btn-glass" data-track="cta_book_call">
            <Image src="/images/icon-phone.svg" alt="" width={14} height={14} />
            Book a Call
          </a>
          <a href="#contact" className="btn btn-dark" data-track="cta_lets_chat">
            Let’s Chat
            <ArrowUpRight />
          </a>
        </div>

        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-[10px] lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-[12px] w-5">
            <span
              className={`absolute left-0 h-[2px] w-5 rounded bg-ink transition-transform ${open ? "top-[5px] rotate-45" : "top-0"}`}
            />
            <span
              className={`absolute left-0 h-[2px] w-5 rounded bg-ink transition-transform ${open ? "top-[5px] -rotate-45" : "top-[10px]"}`}
            />
          </span>
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-ink/10 bg-page px-4 py-4 lg:hidden">
          <ul className="flex flex-col gap-1">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-[8px] p-3 text-[16px] text-ink-2 hover:bg-ink/5"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-[10px] md:hidden">
            <a {...bookProps} onClick={() => setOpen(false)} className="btn btn-glass" data-track="cta_book_call">
              <Image src="/images/icon-phone.svg" alt="" width={14} height={14} />
              Book a Call
            </a>
            <a href="#contact" onClick={() => setOpen(false)} className="btn btn-dark" data-track="cta_lets_chat">
              Let’s Chat
              <ArrowUpRight />
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
