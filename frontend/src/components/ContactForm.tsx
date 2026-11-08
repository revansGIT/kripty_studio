"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { budgets } from "@/lib/content";
import { siteConfig } from "@/lib/site";
import { getVisitorId } from "@/lib/tracking";
import { ArrowUpRight, DarkTextures, PillDark } from "./ui";

type Status = { kind: "idle" | "sending" | "success" | "error"; message?: string };

const label = "text-[14px] leading-none text-white";

export function ContactForm() {
  const [budget, setBudget] = useState<string>("1k-5k");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setStatus({ kind: "sending" });
    try {
      const res = await fetch(`${siteConfig.apiUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, budget, visitorId: getVisitorId() ?? undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const first = json.issues ? Object.values(json.issues).flat()[0] : null;
        throw new Error((first as string) || json.error || "Something went wrong");
      }
      form.reset();
      setStatus({ kind: "success", message: "Thanks! We’ll get back to you within 24 hours." });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Could not send your inquiry" });
    }
  }

  return (
    <section id="contact" aria-labelledby="contact-title" className="mx-auto mt-[120px] max-w-[1440px] scroll-mt-20 px-4 pb-[120px] 2xl:px-0">
      <div className="relative overflow-hidden rounded-[100px] bg-ink px-4 pb-[50px] pt-[90px] max-md:rounded-[40px] max-md:pt-16">
        <DarkTextures bottomGlow={-260} bottomTexture={-30} />

        <div className="relative mx-auto flex max-w-[862px] flex-col items-center gap-[50px] text-center">
          <PillDark>Selected Works</PillDark>
          <div className="flex flex-col items-center gap-[25px]">
            <h2 id="contact-title" className="display text-silver leading-none tracking-[-0.02em]">
              Let’s <em className="font-bold italic">Enhance</em> Your Brand
            </h2>
            <p className="text-[16px] leading-none text-muted max-sm:leading-snug">
              Fill in the required details below and submit the form to get your project started.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="relative mx-auto mt-[70px] flex max-w-[860px] flex-col items-center gap-[60px]" noValidate={false}>
          <div className="flex w-full flex-col gap-[30px]">
            <div className="flex flex-col gap-[14px]">
              <label htmlFor="name" className={label}>
                Your Name*
              </label>
              <div className="relative">
                <Image src="/images/icon-user.svg" alt="" width={13} height={16} className="absolute left-[17px] top-1/2 -translate-y-1/2" />
                <input id="name" name="name" required minLength={2} autoComplete="name" placeholder="Enter your Name" className="field pl-[42px] pr-4" />
              </div>
            </div>

            <div className="grid gap-[20px] md:grid-cols-2">
              <div className="flex flex-col gap-[14px]">
                <label htmlFor="telegram" className={label}>
                  Your Telegram (Optional)
                </label>
                <div className="relative">
                  <Image src="/images/icon-user.svg" alt="" width={13} height={16} className="absolute left-[17px] top-1/2 -translate-y-1/2" />
                  <input id="telegram" name="telegram" placeholder="Enter telegram username" className="field pl-[42px] pr-4" />
                </div>
              </div>
              <div className="flex flex-col gap-[14px]">
                <label htmlFor="email" className={label}>
                  Your Email*
                </label>
                <div className="relative">
                  <Image src="/images/icon-email.svg" alt="" width={16} height={14} className="absolute left-[15.9px] top-1/2 -translate-y-1/2" />
                  <input id="email" name="email" type="email" required autoComplete="email" placeholder="Enter your Email" className="field pl-[42px] pr-4" />
                </div>
              </div>
            </div>

            <fieldset className="flex flex-col gap-[14px]">
              <legend className={`${label} mb-[14px]`}>Your Budget Range</legend>
              <div className="flex flex-wrap gap-[15px] md:flex-nowrap">
                {budgets.map((b) => {
                  const selected = b.value === budget;
                  return (
                    <button
                      key={b.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setBudget(b.value)}
                      className={`h-[48px] w-[131px] rounded-[10px] border text-center text-[14px] leading-none backdrop-blur-[3px] transition-colors shrink-0 max-md:flex-1 max-md:basis-[40%] ${
                        selected
                          ? "border-white bg-shade-04 text-ink"
                          : "border-white/10 bg-[rgba(224,222,230,0.08)] text-muted hover:text-white"
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-[14px]">
              <label htmlFor="details" className={label}>
                Project Details*
              </label>
              <textarea
                id="details"
                name="details"
                required
                minLength={10}
                rows={4}
                placeholder="Describe about your project or idea..."
                className="field h-[120px] resize-none bg-[rgba(224,222,230,0.05)] px-[19px] py-[17px]"
              />
            </div>
          </div>

          <div className="relative flex flex-col items-center">
            <button type="submit" disabled={status.kind === "sending"} className="btn btn-light disabled:opacity-60">
              {status.kind === "sending" ? "Sending…" : "Submit Inquiry"}
              <ArrowUpRight />
            </button>
            <p aria-live="polite" className={`absolute top-[60px] whitespace-nowrap text-[14px] leading-none ${status.kind === "error" ? "text-red-400" : "text-emerald-400"}`}>
              {status.message}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
