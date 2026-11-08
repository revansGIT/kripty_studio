"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { adminToken, api } from "@/lib/admin-api";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z" },
  { href: "/admin/inquiries", label: "Inquiries", icon: "M4 4h16v12H5.2L4 17.2zm4 4h8M8 12h5" },
  { href: "/admin/subscribers", label: "Subscribers", icon: "M3 7l9 6 9-6M3 7v10h18V7M3 7l9-4 9 4" },
  { href: "/admin/analytics", label: "Analytics", icon: "M4 20V10m6 10V4m6 16v-7m4 7H2" },
  { href: "/admin/visitors", label: "Visitors", icon: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m11-14a4 4 0 11-8 0 4 4 0 018 0zm9 14v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" },
  { href: "/admin/faqs", label: "FAQs", icon: "M12 22a10 10 0 100-20 10 10 0 000 20zM9.1 9a3 3 0 115.8 1c-.6 1.3-2.9 1.7-2.9 3.2M12 17h.01" },
  { href: "/admin/works", label: "Works", icon: "M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6M8.5 9.5h.01" },
  { href: "/admin/testimonials", label: "Testimonials", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2zM8 9h8M8 13h5" },
  { href: "/admin/settings", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.3l2-1.5-2-3.4-2.3 1a7.6 7.6 0 00-2.2-1.3L14.4 3h-4l-.4 2.5a7.6 7.6 0 00-2.2 1.3l-2.3-1-2 3.4 2 1.5a7.4 7.4 0 000 2.6l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 002.2 1.3l.4 2.5h4l.4-2.5a7.6 7.6 0 002.2-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Guard: every panel page requires a valid session; otherwise go to the login screen.
  useEffect(() => {
    if (!adminToken.get()) {
      router.replace("/admin/login");
      return;
    }
    api<{ email: string }>("/me")
      .then((me) => setEmail(me.email))
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  function signOut() {
    adminToken.clear();
    router.replace("/admin/login");
  }

  if (!email) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0b0b0d] text-sm text-zinc-400" role="status">
        Loading…
      </div>
    );
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-zinc-200 lg:grid lg:grid-cols-[240px_1fr]">
      {/* Mobile top bar */}
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-4 lg:hidden">
        <span className="text-white">Kripty Admin</span>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-sm"
        >
          Menu
        </button>
      </div>

      <aside
        id="admin-sidebar"
        className={`${menuOpen ? "block" : "hidden"} border-b border-white/10 bg-[#0e0e11] p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r`}
      >
        <Link href="/admin" className="mb-6 hidden px-2 py-1 text-lg text-white lg:block">
          Kripty <span className="text-violet-400">Admin</span>
        </Link>
        <nav aria-label="Admin" className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive(item.href) ? "bg-violet-600/20 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon d={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-white/10 pt-4 lg:mt-auto">
          <a href="/" target="_blank" rel="noopener" className="mb-3 block px-3 text-sm text-zinc-400 hover:text-white">
            View website ↗
          </a>
          <p className="truncate px-3 text-xs text-zinc-500" title={email}>
            {email}
          </p>
          <button type="button" onClick={signOut} className="mt-2 w-full rounded-lg border border-white/15 px-3 py-2 text-left text-sm hover:bg-white/5">
            Sign out
          </button>
        </div>
      </aside>

      <main id="main" className="min-w-0 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
