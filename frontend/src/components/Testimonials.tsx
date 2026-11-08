"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Slideshow, Testimonial } from "@/lib/cms";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { PillDark } from "./ui";

function Avatar({ t }: { t: Testimonial }) {
  if (!t.avatar) {
    return (
      <span aria-hidden className="grid size-[60px] shrink-0 place-items-center rounded-full bg-card-3 text-[22px] text-white">
        {t.name.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <Image
      src={t.avatar}
      alt={`${t.name} avatar`}
      width={60}
      height={60}
      // Avatars uploaded in the admin are served by the API, not by Next, so skip the optimizer.
      unoptimized={!t.avatar.startsWith("/")}
      className="size-[60px] shrink-0 rounded-full object-cover"
    />
  );
}

function Person({ t, roleClass = "text-muted" }: { t: Testimonial; roleClass?: string }) {
  return (
    <div className="flex items-center gap-[20px]">
      <Avatar t={t} />
      <div className="flex w-[150px] flex-col gap-[4px] leading-[1.2]">
        <p className="text-[18px] font-bold text-white">{t.name}</p>
        <p className={`whitespace-nowrap text-[16px] ${roleClass}`}>{t.role}</p>
      </div>
    </div>
  );
}

function QuoteCard({ t, rotate }: { t: Testimonial; rotate: number }) {
  return (
    <div className="flex h-[506.628px] w-[485.415px] items-center justify-center">
      <figure
        aria-hidden="true"
        className="relative h-[420px] w-[390px] overflow-hidden rounded-[30px] bg-card transition-transform duration-500"
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        <blockquote className="absolute left-[30px] right-[30px] top-[28.4px] line-clamp-8 text-[16px] leading-[1.4] text-white">
          {t.quote}
        </blockquote>
        <figcaption className="absolute left-[30px] top-[330px]">
          <Person t={t} roleClass={rotate > 0 ? "text-white/50" : "text-muted"} />
        </figcaption>
      </figure>
    </div>
  );
}

/**
 * The focused (centre) card's media area. Plays the testimonial's video while the section is on screen
 * and calls onDone when it ends. Without a video (or if it cannot play) it shows the quote and calls
 * onDone after a short delay instead. Keyed by testimonial, so its state resets for every card.
 */
function Stage({
  t,
  playing,
  autoAdvance,
  loop,
  controls,
  muted,
  maxVideoSeconds,
  quoteSeconds,
  onMutedChange,
  onProgress,
  onDone,
}: {
  t: Testimonial;
  playing: boolean;
  autoAdvance: boolean;
  loop: boolean;
  controls: boolean;
  muted: boolean;
  /** 0 = play the whole video; otherwise move on after this many seconds. */
  maxVideoSeconds: number;
  quoteSeconds: number;
  onMutedChange: (muted: boolean) => void;
  onProgress: (fraction: number) => void;
  onDone: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const hasVideo = !!t.video && !failed;

  // Play only while visible. Autoplay needs sound off, so if the browser refuses unmuted
  // playback we retry muted, and only fall back to the quote card if that fails too.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!playing) {
      video.pause();
      return;
    }
    video.play().catch(() => {
      if (!video.muted) {
        video.muted = true;
        onMutedChange(true);
        video.play().catch(() => setFailed(true));
      } else {
        setFailed(true);
      }
    });
  }, [playing, hasVideo, onMutedChange]);

  // No video: advance after quoteSeconds of visible time.
  useEffect(() => {
    if (hasVideo || !playing || !autoAdvance) return;
    let elapsed = 0;
    const id = setInterval(() => {
      elapsed += 100;
      onProgress(Math.min(1, elapsed / (quoteSeconds * 1000)));
      if (elapsed >= quoteSeconds * 1000) {
        clearInterval(id);
        onDone();
      }
    }, 100);
    return () => clearInterval(id);
  }, [hasVideo, playing, autoAdvance, quoteSeconds, onProgress, onDone]);

  return (
    <div className="absolute left-[20px] top-[20px] h-[345px] w-[350px] overflow-hidden rounded-[20px] bg-card-3">
      {hasVideo ? (
        <>
          <video
            ref={videoRef}
            // #t=0.1 makes browsers show the first frame as a poster before playback starts.
            src={`${t.video}#t=0.1`}
            muted={muted}
            playsInline
            preload="metadata"
            loop={loop}
            controls={controls}
            aria-label={`Video testimonial from ${t.name}`}
            className="absolute inset-0 size-full object-cover"
            onTimeUpdate={(e) => {
              const { currentTime, duration } = e.currentTarget;
              // Some WebM files report an infinite duration; skip progress for those.
              if (Number.isFinite(duration) && duration > 0) {
                // The admin can cap how long each video plays; a shorter video still ends on its own.
                const limit = maxVideoSeconds > 0 ? Math.min(duration, maxVideoSeconds) : duration;
                onProgress(Math.min(1, currentTime / limit));
                if (autoAdvance && maxVideoSeconds > 0 && currentTime >= maxVideoSeconds) onDone();
              } else if (autoAdvance && maxVideoSeconds > 0 && currentTime >= maxVideoSeconds) {
                onDone();
              }
            }}
            onEnded={() => autoAdvance && onDone()}
            onError={() => setFailed(true)}
          />
          {!controls && (
            <button
              type="button"
              onClick={() => onMutedChange(!muted)}
              aria-label={muted ? "Unmute video" : "Mute video"}
              className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4z" />
                {muted ? <path d="m22 9-6 6m0-6 6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
              </svg>
            </button>
          )}
          <blockquote className="sr-only">{t.quote}</blockquote>
        </>
      ) : (
        <blockquote className="line-clamp-[10] p-6 text-[16px] leading-[1.5] text-white">{t.quote}</blockquote>
      )}
    </div>
  );
}

export function Testimonials({ testimonials, slideshow }: { testimonials: Testimonial[]; slideshow: Slideshow }) {
  const count = testimonials.length;
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const index = count ? Math.min(active, count - 1) : 0;
  const at = (offset: number) => testimonials[(index + offset) % count];
  const autoAdvance = count > 1 && !reducedMotion;
  const playing = inView && tabVisible && !userPaused && !reducedMotion;

  const goTo = useCallback((i: number) => {
    setActive(i);
    setProgress(0);
  }, []);
  const next = useCallback(() => {
    setActive((a) => (a + 1) % count);
    setProgress(0);
  }, [count]);

  // Only play (and advance) while the section is on screen and the tab is visible.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const current = count ? testimonials[index] : null;

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="relative mt-[80px] scroll-mt-20 pb-[125px] min-[1700px]:ml-[calc(50%-820px)] min-[1700px]:w-[1660px]"
    >
      <div className="flex items-center justify-between gap-12 px-4 max-[1700px]:flex-col max-[1700px]:items-center min-[1700px]:px-0">
        <div className="flex w-full max-w-[646px] flex-col items-start gap-[50px]">
          <PillDark>Client Stories</PillDark>
          <div className="flex flex-col gap-[25px]">
            <h2 id="testimonials-title" className="display text-silver leading-none tracking-[-0.02em]">
              What Clients Say
              <br />
              About Kripty Studio
            </h2>
            <p className="max-w-[521px] text-[16px] leading-none text-muted max-sm:leading-snug">
              Hear from the people we&apos;ve worked with and discover what makes our collaborations meaningful.
            </p>
          </div>
        </div>

        {current && (
          <div className="flex w-full max-w-[865.415px] flex-col items-center gap-[60px] max-md:overflow-hidden">
            <div className="grid origin-top grid-cols-[max-content] grid-rows-[max-content] max-md:-mb-[290px] max-md:scale-[0.42] md:max-lg:-mb-[126px] md:max-lg:scale-75">
              {count > 1 && (
                <div className="col-start-1 row-start-1 ml-[380px]">
                  <QuoteCard t={at(1)} rotate={15} />
                </div>
              )}
              {count > 2 && (
                <div className="col-start-1 row-start-1">
                  <QuoteCard t={at(2)} rotate={-15} />
                </div>
              )}
              <figure className="relative col-start-1 row-start-1 ml-[238px] mt-[13.31px] h-[480px] w-[390px] overflow-hidden rounded-[30px] bg-card-2 shadow-[0_0_200px_0_#0a0a0a]">
                <Stage
                  key={current.name}
                  t={current}
                  playing={playing}
                  autoAdvance={autoAdvance}
                  loop={count === 1}
                  controls={reducedMotion}
                  muted={muted}
                  maxVideoSeconds={slideshow.videoSeconds}
                  quoteSeconds={slideshow.quoteSeconds}
                  onMutedChange={setMuted}
                  onProgress={setProgress}
                  onDone={next}
                />
                <figcaption className="absolute left-[30px] top-[390px]">
                  <Person t={current} />
                </figcaption>
              </figure>
            </div>

            {count > 1 && (
              <div className="flex items-center gap-[14px]">
                <div role="tablist" aria-label="Choose testimonial" className="flex items-center gap-[6px]">
                  {testimonials.map((t, i) => {
                    const isActive = i === index;
                    return (
                      <button
                        key={t.name}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Show testimonial from ${t.name}`}
                        onClick={() => goTo(i)}
                        className={`relative h-[6px] overflow-hidden rounded-[50px] bg-card-3 transition-[width,background-color] duration-300 ${isActive ? "w-[48px]" : "w-[26px] hover:bg-[#3a3a3a]"}`}
                      >
                        {isActive && (
                          <span
                            className="absolute inset-y-0 left-0 bg-[#d9d9d9] transition-[width] duration-300 ease-linear"
                            style={{ width: `${autoAdvance ? Math.max(progress, 0.04) * 100 : 100}%` }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                {!reducedMotion && (
                  <button
                    type="button"
                    onClick={() => setUserPaused((p) => !p)}
                    aria-label={userPaused ? "Resume automatic slideshow" : "Pause automatic slideshow"}
                    className="grid size-7 place-items-center rounded-full text-[#9a9a9a] transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      {userPaused ? <path d="M7 4v16l13-8z" /> : <path d="M6 4h4v16H6zm8 0h4v16h-4z" />}
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
