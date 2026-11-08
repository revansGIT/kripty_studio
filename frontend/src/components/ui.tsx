import Image from "next/image";
import type { ReactNode } from "react";

/** Diagonal "↗" arrow drawn from three rounded 1.66px bars, as in the Figma buttons. */
export function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.66"
      strokeLinecap="round"
    >
      <path d="M.83.83h8.34v8.34M9.17.83.83 9.17" />
    </svg>
  );
}

export function PillDark({ children }: { children: ReactNode }) {
  return (
    <span className="pill-dark">
      <Image src="/images/icon-coins.svg" alt="" width={18} height={18} className="relative" />
      <span className="relative">{children}</span>
    </span>
  );
}

export function PillLight({ children }: { children: ReactNode }) {
  return (
    <span className="pill-light">
      <Image src="/images/dot-green.svg" alt="" width={7} height={7} />
      {children}
    </span>
  );
}

/** Luminosity-blended grain textures used at the top/bottom of the dark panels. */
export function DarkTextures({ bottomTexture = -76, bottomGlow = 0 }: { bottomTexture?: number; bottomGlow?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-155px] h-[630px] w-[1922px] -translate-x-1/2 mix-blend-luminosity">
        <Image src="/images/texture-hero.jpg" alt="" fill sizes="1922px" className="object-fill" />
      </div>
      <div className="absolute inset-x-0 top-0 h-[306px] -scale-y-100 overflow-hidden mix-blend-luminosity">
        <Image src="/images/texture-top.png" alt="" fill sizes="100vw" className="!top-[-9.83%] !h-[119.65%] object-fill" />
      </div>
      <div
        className="absolute left-1/2 h-[630px] w-[1922px] -translate-x-1/2 -scale-y-100 mix-blend-luminosity"
        style={{ bottom: bottomGlow }}
      >
        <Image src="/images/texture-hero.jpg" alt="" fill sizes="1922px" className="object-fill" />
      </div>
      <div className="absolute inset-x-0 h-[306px] overflow-hidden mix-blend-luminosity" style={{ bottom: bottomTexture }}>
        <Image src="/images/texture-top.png" alt="" fill sizes="100vw" className="!top-[-9.83%] !h-[119.65%] object-fill" />
      </div>
    </div>
  );
}
