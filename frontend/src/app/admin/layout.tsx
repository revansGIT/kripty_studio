import type { Metadata } from "next";
import type { ReactNode } from "react";

// The admin area must never appear in search results.
export const metadata: Metadata = {
  title: { absolute: "Admin | Kripty Studio" },
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="font-semibold">{children}</div>;
}
