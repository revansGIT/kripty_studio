import Image from "next/image";
import { brands } from "@/lib/brands";

// The row is rendered three times so the loop is seamless on any screen width (one copy is ~2,500px wide).
// Only the first copy is exposed to assistive technology and search engines.
const COPIES = 3;

/** Logos that slide continuously from left to right. Pure CSS: no client JavaScript. */
export function BrandMarquee() {
  return (
    <div className="brand-marquee relative h-[94px] w-full overflow-hidden bg-[linear-gradient(90deg,rgba(10,10,10,0)_0%,rgba(10,10,10,0.1)_50%,rgba(10,10,10,0)_100%)]">
      <ul aria-label="Brands we have worked with" className="brand-track absolute inset-y-0 left-0 flex w-max items-center">
        {Array.from({ length: COPIES }, (_, copy) =>
          brands.map((brand) => (
            <li key={`${copy}-${brand.name}`} aria-hidden={copy > 0 || undefined} className="mr-[78px] shrink-0">
              <Image
                src={brand.src}
                alt={copy === 0 ? brand.name : ""}
                width={brand.width}
                height={brand.height}
                // All copies are in the DOM from the start, so load them eagerly to avoid logos popping in while sliding.
                loading="eager"
                draggable={false}
                className="max-w-none select-none"
              />
            </li>
          )),
        )}
      </ul>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-page to-page/0" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-r from-page/0 to-page" />
    </div>
  );
}
