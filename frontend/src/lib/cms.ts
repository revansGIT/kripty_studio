import { cacheLife, cacheTag } from "next/cache";
import { faqs as defaultFaqs, testimonials as defaultTestimonials, works as defaultWorks } from "./content";
import { siteConfig } from "./site";

export type Faq = { q: string; a: string };
export type Work = { src: string; alt: string; url?: string };
export type SiteLinks = {
  bookingUrl: string;
  telegramUrl: string;
  portfolioUrl: string;
  behanceUrl: string;
  dribbbleUrl: string;
  instagramUrl: string;
  xUrl: string;
  pinterestUrl: string;
};
export type Testimonial = { name: string; role: string; quote: string; avatar: string | null; video: string | null };

// Content is cached for hours and refreshed instantly when the admin saves a change
// (the API calls /api/revalidate, which invalidates the "content" tag).
async function fetchFaqs(): Promise<Faq[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");
  const res = await fetch(`${siteConfig.apiUrl}/api/content/faqs`);
  if (!res.ok) throw new Error(`FAQ request failed: ${res.status}`);
  return (await res.json()).items;
}

async function fetchWorks(): Promise<Work[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");
  const res = await fetch(`${siteConfig.apiUrl}/api/content/works`);
  if (!res.ok) throw new Error(`Works request failed: ${res.status}`);
  return (await res.json()).items;
}

async function fetchTestimonials(): Promise<Testimonial[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");
  const res = await fetch(`${siteConfig.apiUrl}/api/content/testimonials`);
  if (!res.ok) throw new Error(`Testimonials request failed: ${res.status}`);
  return (await res.json()).items;
}

async function fetchLinks(): Promise<SiteLinks> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");
  const res = await fetch(`${siteConfig.apiUrl}/api/content/links`);
  if (!res.ok) throw new Error(`Links request failed: ${res.status}`);
  return res.json();
}

// A failed fetch throws inside the cached scope (so the failure is never cached);
// the wrappers below fall back to the bundled defaults so the page still renders.
export async function getFaqs(): Promise<Faq[]> {
  try {
    return await fetchFaqs();
  } catch {
    return [...defaultFaqs];
  }
}

export async function getWorks(): Promise<Work[]> {
  try {
    return await fetchWorks();
  } catch {
    return [...defaultWorks];
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    return await fetchTestimonials();
  } catch {
    return defaultTestimonials.map((t) => ({ name: t.name, role: t.role, quote: t.quote, avatar: t.avatar, video: null }));
  }
}

/** Client Stories timing set in the admin: videoSeconds 0 = play each video to the end. */
export type Slideshow = { videoSeconds: number; quoteSeconds: number };

async function fetchSlideshow(): Promise<Slideshow> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");
  const res = await fetch(`${siteConfig.apiUrl}/api/content/slideshow`);
  if (!res.ok) throw new Error(`Slideshow request failed: ${res.status}`);
  return res.json();
}

export async function getSlideshow(): Promise<Slideshow> {
  try {
    return await fetchSlideshow();
  } catch {
    return { videoSeconds: 0, quoteSeconds: 6 };
  }
}

/** Booking page + Telegram chat. Empty strings mean "not configured yet" (the site then falls back to the contact form). */
export async function getSiteLinks(): Promise<SiteLinks> {
  try {
    return await fetchLinks();
  } catch {
    return { bookingUrl: "", telegramUrl: "", portfolioUrl: "", behanceUrl: "", dribbbleUrl: "", instagramUrl: "", xUrl: "", pinterestUrl: "" };
  }
}
