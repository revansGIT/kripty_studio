import Image from "next/image";
import { ArrowUpRight, PillDark } from "./ui";

export function Network() {
  return (
    <section
      id="network"
      aria-labelledby="network-title"
      className="relative mx-auto mt-[120px] flex max-w-[1920px] items-center max-xl:flex-col-reverse max-xl:gap-12 xl:h-[857px]"
    >
      <div className="relative aspect-[1000/857] w-full max-w-[1000px] shrink-0 bg-[#08080a] mix-blend-lighten xl:absolute xl:bottom-0 xl:left-0 xl:w-[1000px]">
        <Image
          src="/images/world-map.png"
          alt="Map of Kripty Studio's client network in the United Kingdom, California and Florida"
          fill
          sizes="(max-width: 1280px) 100vw, 1000px"
          className="object-fill"
        />
      </div>

      <div className="relative flex w-full flex-col items-start gap-[80px] px-4 xl:absolute xl:left-[calc(50%+140px)] xl:top-[212px] xl:w-[635px] xl:px-0">
        <div className="flex w-full flex-col items-start gap-[50px]">
          <PillDark>Our Networks</PillDark>
          <div className="flex flex-col gap-[25px]">
            <h2 id="network-title" className="display text-silver leading-none tracking-[-0.02em]">
              Connecting Brands
              <br />
              <em className="font-bold italic">Worldwide.</em>
            </h2>
            <p className="max-w-[521px] text-[16px] leading-none text-muted max-sm:leading-snug">
              We collaborate with ambitious brands worldwide to create meaningful digital experiences that drive
              growth.
            </p>
          </div>
        </div>
        <a href="#testimonials" className="btn btn-light" data-track="cta_clients_feedback">
          Our Clients Feedback
          <ArrowUpRight />
        </a>
      </div>
    </section>
  );
}
