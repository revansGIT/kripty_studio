"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import type { SiteLinks } from "@/lib/cms";
import { siteConfig } from "@/lib/site";
import { getVisitorId } from "@/lib/tracking";


export function Footer({ links }: { links: SiteLinks }) {
  // Only the profiles that have an address in the admin get a button, so there are no dead buttons.
  const socials = siteConfig.socials.map((s) => ({ ...s, href: links[s.key] })).filter((s) => s.href);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = new FormData(form).get("email");
    setSending(true);
    try {
      const res = await fetch(`${siteConfig.apiUrl}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, visitorId: getVisitorId() ?? undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.issues?.email?.[0] || json.error || "Subscription failed");
      form.reset();
      setMsg({ ok: true, text: json.alreadySubscribed ? "You’re already subscribed." : "Thanks for subscribing!" });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Subscription failed" });
    } finally {
      setSending(false);
    }
  }

  return (
    <footer className="relative mt-[60px] overflow-hidden rounded-t-[80px] bg-ink px-4 pb-[60px] pt-[100px] backdrop-blur-[3px] max-md:rounded-t-[40px] max-md:pt-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-[-33px] left-0 h-[630px] w-[1922px] mix-blend-luminosity max-[1920px]:left-1/2 max-[1920px]:-translate-x-1/2">
          <Image src="/images/texture-hero.jpg" alt="" fill sizes="1922px" className="object-fill" />
        </div>
        <div className="absolute inset-x-0 top-0 h-[306px] -scale-y-100 overflow-hidden mix-blend-luminosity">
          <Image src="/images/texture-top.png" alt="" fill sizes="100vw" className="!top-[-9.83%] !h-[119.65%] object-fill" />
        </div>
      </div>

      <div className="relative mx-auto flex max-w-[862px] flex-col items-center gap-[25px] text-center">
        <h2 className="display text-silver leading-[0.9] tracking-[-0.02em]">
          <em className="font-bold italic">Good Business</em> StartsWith
          <br />a Connection.
        </h2>
        <p className="text-[16px] leading-none text-muted max-sm:leading-snug">
          Get occasional updates on our latest work, creative insights, and studio news.
        </p>
      </div>

      {socials.length > 0 && (
        <ul aria-label="Social media" className="relative mt-[50px] flex flex-wrap justify-center gap-[10px]">
          {socials.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                aria-label={`${s.label} (opens in a new tab)`}
                target="_blank"
                rel="noopener noreferrer"
                data-track="social_click"
                data-track-label={s.label}
                className="pill-dark !size-[44px] !rounded-[10px] !p-0 justify-center bg-[linear-gradient(180deg,rgba(224,222,230,0.15),rgba(27,27,27,0.15))] transition-transform hover:-translate-y-0.5"
              >
                <Image src={s.icon} alt="" width={s.size[0]} height={s.size[1]} className="relative" />
              </a>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubscribe} className="relative mx-auto mt-[60px] flex max-w-[464px] gap-[10px]">
        <label htmlFor="newsletter-email" className="sr-only">
          Your email address
        </label>
        <div className="relative flex-1">
          <Image src="/images/icon-email.svg" alt="" width={16} height={14} className="absolute left-[15.9px] top-1/2 -translate-y-1/2" />
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Your email address"
            className="field pl-[42px] pr-4"
          />
        </div>
        <button type="submit" disabled={sending} className="btn btn-light disabled:opacity-60">
          {sending ? "…" : "Subscribe"}
        </button>
      </form>
      <p aria-live="polite" className={`absolute inset-x-0 bottom-[30px] text-center text-[14px] leading-none ${msg?.ok ? "text-emerald-400" : "text-red-400"}`}>
        {msg?.text}
      </p>
    </footer>
  );
}
