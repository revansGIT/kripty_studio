"use client";

import Image from "next/image";
import { useState } from "react";
import type { Faq as FaqItem } from "@/lib/cms";
import { PillLight } from "./ui";

export function Faq({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  if (faqs.length === 0) return null;

  return (
    <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-[1440px] scroll-mt-20 px-4 pt-[120px] 2xl:px-0">
      <div className="mx-auto flex max-w-[882px] flex-col items-center gap-[30px] text-center">
        <PillLight>GOT QUESTIONS?</PillLight>
        <div className="flex flex-col items-center gap-[20px]">
          <h2 id="faq-title" className="display leading-[1.1] tracking-[-0.04em] text-ink">
            Frequently Asked <em className="font-bold italic">Questions</em>
          </h2>
          <p className="text-[16px] leading-none text-ink-2 max-sm:leading-snug">
            Everything you need to know before starting your next project with us.
          </p>
        </div>
      </div>

      <dl className="mt-[100px] grid items-start gap-[20px] lg:grid-cols-2">
        {faqs.map((item, i) => {
          const isOpen = open === i;
          const id = `faq-${i}`;
          return (
            <div key={item.q} className="overflow-hidden rounded-[18px] bg-white">
              <dt>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`${id}-panel`}
                  id={`${id}-button`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className={`flex w-full items-center justify-between gap-6 px-[30px] text-left text-[18px] leading-none text-ink ${isOpen ? "pt-[25px]" : "min-h-[84px] py-[20px]"}`}
                >
                  <span className={isOpen ? "py-[5px]" : ""}>{item.q}</span>
                  <Image
                    src="/images/icon-chevron-circle.svg"
                    alt=""
                    width={28}
                    height={28}
                    className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </dt>
              <dd
                id={`${id}-panel`}
                role="region"
                aria-labelledby={`${id}-button`}
                className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden">
                  <p className="max-w-[600px] px-[30px] pb-[20px] pt-[25px] text-[18px] leading-none text-ink/50 max-sm:leading-snug">
                    {item.a}
                  </p>
                </div>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
