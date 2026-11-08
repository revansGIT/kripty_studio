import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: "Kripty",
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f6",
    theme_color: "#0a0a0a",
    icons: [{ src: "/icon.png", sizes: "any", type: "image/png" }],
  };
}
