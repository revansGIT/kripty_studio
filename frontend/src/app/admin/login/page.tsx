"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { adminToken, api } from "@/lib/admin-api";
import { setTrackingOptOut } from "@/lib/tracking";
import { btnPrimary, ErrorNote, input } from "@/components/admin/common";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (adminToken.get()) router.replace("/admin");
  }, [router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ token: string }>("/login", {
        method: "POST",
        body: { email: data.get("email"), password: data.get("password") },
      });
      adminToken.set(res.token);
      setTrackingOptOut(true); // don't count the owner's own visits
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
      setBusy(false);
    }
  }

  return (
    <main id="main" className="grid min-h-screen place-items-center bg-[#0b0b0d] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-[380px] rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="text-2xl text-white">
          Kripty <span className="text-violet-400">Admin</span>
        </h1>
        <p className="mb-6 mt-1 text-sm text-zinc-400">Sign in to manage inquiries and subscribers.</p>
        <ErrorNote message={error} />
        <label htmlFor="email" className="mb-1.5 block text-sm text-zinc-300">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" className={`${input} mb-4`} />
        <label htmlFor="password" className="mb-1.5 block text-sm text-zinc-300">
          Password
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={`${input} mb-6`} />
        <button type="submit" disabled={busy} className={`${btnPrimary} h-10 w-full`}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
