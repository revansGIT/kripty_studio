import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 30% 50%, #e9c8ff 0%, #f6f5f6 45%), #f6f5f6",
          color: "#0a0a0a",
          fontWeight: 700,
        }}
      >
        <div style={{ fontSize: 28, padding: "10px 22px", borderRadius: 40, background: "rgba(10,10,10,0.1)" }}>
          A Digital Design Agency
        </div>
        <div style={{ display: "flex", fontSize: 76, marginTop: 36, letterSpacing: -3 }}>
          We Create&nbsp;
          <span style={{ background: "#a100ff", color: "#f6f5f6", padding: "0 12px", fontStyle: "italic" }}>Designs</span>
        </div>
        <div style={{ fontSize: 76, letterSpacing: -3 }}>that Drive Businesses Forward.</div>
        <div style={{ fontSize: 34, marginTop: 40 }}>{siteConfig.name}</div>
      </div>
    ),
    size,
  );
}
