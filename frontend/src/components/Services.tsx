/* eslint-disable @next/next/no-img-element -- decorative layered SVGs; next/image does not optimize SVG */
import Image from "next/image";
import type { CSSProperties } from "react";
import { services } from "@/lib/content";
import { Reveal } from "./Reveal";
import { PillDark } from "./ui";

// The dashed connector between two icons, traced from the exported curve image (350x54 box).
const CURVE_PATH =
  "M0 0.1 L10 6.4 L20 13.4 L30 19 L40 24.2 L50 28.6 L60 32.8 L70 36.1 L80 39.7 L90 41.5 L100 45 L110 46.9 L120 49.4 L130 50.3 L140 52 L150 52.3 L160 53 L170 53.3 L180 53.3 L190 53 L200 52.3 L210 52 L220 50.3 L230 49.4 L240 46.9 L250 45 L260 41.5 L270 39.7 L280 36.1 L290 32.8 L300 28.6 L310 24.2 L320 19 L330 13.4 L340 6.4 L350 0.1";

// One 6-second loop: a light leaves icon 1, reaches icon 2 (which pulses), leaves again and reaches icon 3.
const CYCLE = 6;
const TRAVEL = 2.2;
const SECOND_LEG_START = 2.8;
const ARRIVALS = [0, TRAVEL, SECOND_LEG_START + TRAVEL]; // when each icon pulses (icon 1 pulses as the light departs)

/** A small light that glides along the dashed curve (same box and position as the curve image). */
function Connector({ id, className, flipped = false, start }: { id: string; className: string; flipped?: boolean; start: number }) {
  return (
    <svg aria-hidden className={`svc-connector pointer-events-none absolute hidden overflow-visible xl:block ${className}`} width="350" height="54" viewBox="0 0 350 54" fill="none">
      <defs>
        <filter id={`${id}-glow`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <g transform={flipped ? "translate(0 54) scale(1 -1)" : undefined}>
        <g opacity="0">
          <circle r="11" fill="#fff" opacity="0.3" filter={`url(#${id}-glow)`} />
          <circle r="3.4" fill="#fff" />
          <animateMotion dur={`${CYCLE}s`} begin={`${start}s`} repeatCount="indefinite" path={CURVE_PATH} keyPoints="0;1;1" keyTimes={`0;${TRAVEL / CYCLE};1`} calcMode="linear" />
          <animate
            attributeName="opacity"
            dur={`${CYCLE}s`}
            begin={`${start}s`}
            repeatCount="indefinite"
            values="0;1;1;0;0"
            keyTimes={`0;0.03;${(TRAVEL - 0.3) / CYCLE};${TRAVEL / CYCLE};1`}
          />
        </g>
      </g>
    </svg>
  );
}

/** Shiny glass circle behind each service icon (layers exported from Figma). */
function ServiceIcon({ icon, index }: { icon: (typeof services)[number]["icon"]; index: number }) {
  const shine: CSSProperties = {
    maskImage: 'url("/images/svc-shine-mask.svg")',
    WebkitMaskImage: 'url("/images/svc-shine-mask.svg")',
    maskMode: "alpha",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "59.923px 39.642px",
    WebkitMaskPosition: "59.923px 39.642px",
    maskSize: "120px 119.937px",
    WebkitMaskSize: "120px 119.937px",
  };
  return (
    // The icon floats gently (each one out of step with the others) and lifts a little on hover.
    <div className="svc-float" style={{ ["--i" as string]: index }}>
      <div aria-hidden className="relative size-[120px] shrink-0 transition-transform duration-500 ease-out group-hover/svc:scale-[1.08]">
        {/* Glow ring that pulses when the travelling light arrives (or leaves, for the first icon) */}
        <span className="svc-arrive" style={{ ["--arrive" as string]: `${ARRIVALS[index]}s` }} />
        <div className="absolute inset-[-31.3%_-46.92%_-62.6%_-46.92%]">
          <img src="/images/svc-shadow.svg" alt="" className="block size-full max-w-none" />
        </div>
        <img src="/images/svc-bg-1.svg" alt="" className="absolute inset-0 size-full mix-blend-overlay" />
        <img src="/images/svc-bg-2.svg" alt="" className="absolute inset-0 size-full" />
        {(["/images/svc-shine-1.svg", "/images/svc-shine-2.svg"] as const).map((src, i) => (
          <div
            key={src}
            className={`absolute left-[-59.92px] top-[-39.58px] flex h-[126.089px] w-[169.945px] items-center justify-center ${i ? "mix-blend-overlay" : ""}`}
          >
            <div className="relative h-[54.563px] w-[163.736px] rotate-[-28.51deg]" style={shine}>
              <div className="absolute inset-[-88.27%_-29.42%]">
                <img src={src} alt="" className="block size-full max-w-none" />
              </div>
            </div>
          </div>
        ))}
        <img
          src={icon.src}
          alt=""
          width={icon.width}
          height={icon.height}
          // Each glyph has its own little motion: the pen sketches, the laptop pulses, the ball bounces.
          className={`svc-glyph svc-glyph-${index} absolute`}
          style={{ left: icon.left, top: icon.top, width: icon.width, height: icon.height }}
        />
      </div>
    </div>
  );
}

const columns = [
  { left: 0, width: 291 },
  { left: 536, width: 259 },
  { left: 1045, width: 279 },
];

export function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="relative scroll-mt-20 pb-[78px] pt-[120px]">
      <div className="mx-auto flex max-w-[943px] flex-col items-center gap-[50px] px-4 text-center">
        <Reveal>
          <PillDark>Our Services</PillDark>
        </Reveal>
        <Reveal delay={120} className="flex flex-col items-center gap-[25px]">
          <h2 id="services-title" className="display text-silver shimmer leading-none tracking-[-0.02em]">
            What <em className="font-bold italic">Solutions</em> Do We Offer?
          </h2>
          <p className="text-[16px] leading-none text-muted max-sm:leading-snug">
            Creative solutions to bring your ideas to life and move your business forward.
          </p>
        </Reveal>
      </div>

      <div className="relative mx-auto mt-[150px] max-w-[1324px] px-4 xl:h-[237px] xl:px-0">
        {/* Dashed connector curves, each with a light travelling along it */}
        <Image src="/images/services-curve.png" alt="" aria-hidden width={350} height={54} className="absolute left-[230px] top-[41px] hidden xl:block" />
        <Image src="/images/services-curve.png" alt="" aria-hidden width={350} height={54} className="absolute left-[750px] top-[16px] hidden -scale-y-100 xl:block" />
        <Connector id="svc-c1" className="left-[230px] top-[41px]" start={0} />
        <Connector id="svc-c2" className="left-[750px] top-[16px]" flipped start={SECOND_LEG_START} />

        <ul className="grid gap-16 sm:grid-cols-3 sm:gap-8 xl:block">
          {services.map((service, i) => (
            <li
              key={service.title}
              className="group/svc flex flex-col items-center xl:absolute xl:top-0 xl:[left:var(--l)] xl:[width:var(--w)]"
              style={{ ["--l" as string]: `${columns[i].left}px`, ["--w" as string]: `${columns[i].width}px` }}
            >
              <Reveal delay={i * 160} className="flex flex-col items-center gap-[40px] text-center">
                <ServiceIcon icon={service.icon} index={i} />
                <div className="flex flex-col items-center gap-[20px]">
                  <h3 className="text-[24px] font-bold leading-[0.9] tracking-[-0.48px] text-white">{service.title}</h3>
                  <p className="max-w-[291px] text-[16px] leading-[1.1] text-muted">{service.description}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
