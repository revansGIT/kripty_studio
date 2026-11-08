export const siteConfig = {
  name: "Kripty Studio",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  title: "Kripty Studio — Digital Design Agency for iGaming & Crypto Brands",
  description:
    "Kripty Studio is a digital design agency crafting UI/UX design, frontend development and animation for iGaming, casino and crypto brands worldwide.",
  keywords: [
    "Kripty Studio",
    "digital design agency",
    "iGaming design",
    "crypto casino UI",
    "UI/UX design",
    "frontend development",
    "web animation",
    "sportsbook design",
    "Web3 design studio",
  ],
  nav: [
    { label: "Our Projects", href: "#works" },
    { label: "Services", href: "#services" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
  ],
  // Footer buttons. Each reads its address from the admin's links (key = field name in SiteLinks); no address, no button.
  socials: [
    { key: "behanceUrl", label: "Behance", icon: "/images/social-behance.svg", size: [20, 20] },
    { key: "dribbbleUrl", label: "Dribbble", icon: "/images/social-dribbble.svg", size: [20, 20] },
    { key: "telegramUrl", label: "Telegram", icon: "/images/social-telegram.svg", size: [17, 16] },
    { key: "xUrl", label: "X (Twitter)", icon: "/images/social-x.svg", size: [18, 18] },
    { key: "instagramUrl", label: "Instagram", icon: "/images/social-instagram.svg", size: [20, 20] },
    { key: "pinterestUrl", label: "Pinterest", icon: "/images/social-pinterest.svg", size: [20, 20] },
  ],
} as const;
