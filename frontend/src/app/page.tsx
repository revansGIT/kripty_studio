import { ContactForm } from "@/components/ContactForm";
import { CurtainScroll } from "@/components/CurtainScroll";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Network } from "@/components/Network";
import { Services } from "@/components/Services";
import { TelegramBubble } from "@/components/TelegramBubble";
import { Testimonials } from "@/components/Testimonials";
import { Works } from "@/components/Works";
import { getFaqs, getSiteLinks, getSlideshow, getTestimonials, getWorks, type Faq as FaqItem, type SiteLinks, type Testimonial } from "@/lib/cms";
import { services } from "@/lib/content";
import { siteConfig } from "@/lib/site";

// Structured data for rich results: Organization, WebSite, services and FAQ.
const buildJsonLd = (faqs: FaqItem[], testimonials: Testimonial[], links: SiteLinks) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/icon.png`,
      description: siteConfig.description,
      sameAs: siteConfig.socials.map((s) => links[s.key]).filter(Boolean),
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      publisher: { "@id": `${siteConfig.url}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "ProfessionalService",
      name: siteConfig.name,
      url: siteConfig.url,
      areaServed: "Worldwide",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Design services",
        itemListElement: services.map((s) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: s.title, description: s.description },
        })),
      },
      review: testimonials.map((t) => ({
        "@type": "Review",
        author: { "@type": "Person", name: t.name },
        reviewBody: t.quote,
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
});

export default async function Home() {
  const [faqs, works, testimonials, links, slideshow] = await Promise.all([getFaqs(), getWorks(), getTestimonials(), getSiteLinks(), getSlideshow()]);
  const jsonLd = buildJsonLd(faqs, testimonials, links);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <CurtainScroll />
      <Header bookingUrl={links.bookingUrl} />
      <main id="main">
        {/* The hero is pinned (sticky) only while the dark panel scrolls over it. Scoping it to this wrapper
            releases it when the panel ends, so it can never show through the FAQ and contact sections below. */}
        <div className="relative">
          <Hero />

          <div className="curtain-panel relative z-10 overflow-hidden rounded-[100px] bg-ink max-md:rounded-[40px]">
            <Works works={works} portfolioUrl={links.portfolioUrl} />
            <Services />
            <Network />
            <Testimonials testimonials={testimonials} slideshow={slideshow} />
          </div>
        </div>

        <Faq faqs={faqs} />
        <ContactForm />
      </main>
      <Footer links={links} />
      <TelegramBubble url={links.telegramUrl} />
    </>
  );
}
