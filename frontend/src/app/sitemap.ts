import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      changeFrequency: "monthly",
      priority: 1,
      images: [`${siteConfig.url}/images/work-1.png`, `${siteConfig.url}/images/work-2.png`],
    },
  ];
}
