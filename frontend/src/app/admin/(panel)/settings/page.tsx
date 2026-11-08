"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { adminToken, api } from "@/lib/admin-api";
import { isOptedOut, setTrackingOptOut } from "@/lib/tracking";
import { btn, btnPrimary, Card, ErrorNote, input, PageHeader, Switch } from "@/components/admin/common";

type Links = {
  bookingUrl: string;
  telegramUrl: string;
  portfolioUrl: string;
  behanceUrl: string;
  dribbbleUrl: string;
  instagramUrl: string;
  xUrl: string;
  pinterestUrl: string;
};

// Footer social buttons (Telegram comes from the Telegram field above, so it isn't repeated here).
const SOCIAL_FIELDS = [
  { key: "behanceUrl", label: "Behance", placeholder: "@yourname or https://behance.net/yourname" },
  { key: "dribbbleUrl", label: "Dribbble", placeholder: "@yourname or https://dribbble.com/yourname" },
  { key: "instagramUrl", label: "Instagram", placeholder: "@yourname or https://instagram.com/yourname" },
  { key: "xUrl", label: "X (Twitter)", placeholder: "@yourname or https://x.com/yourname" },
  { key: "pinterestUrl", label: "Pinterest", placeholder: "@yourname or https://pinterest.com/yourname" },
] as const;

/** Where the "Book a Call" button, the Telegram bubble and the "See More Case Studies" button lead to. */
function ContactLinksCard() {
  const [links, setLinks] = useState<Links | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Links | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Links>("/links")
      .then(setLinks)
      .catch((e) => setError(e.message));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      // The server cleans the values up (e.g. "@name" becomes https://t.me/name) and returns what it stored.
      const next = await api<Links>("/links", { method: "PUT", body: Object.fromEntries(["bookingUrl", "telegramUrl", "portfolioUrl", ...SOCIAL_FIELDS.map((f) => f.key)].map((key) => [key, data.get(key)])) });
      setLinks(next);
      setSaved(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Website links" className="max-w-[520px]">
      {!links ? (
        <p className="p-5 text-sm text-zinc-400">{error ?? "Loading…"}</p>
      ) : (
        <form key={JSON.stringify(links)} onSubmit={onSubmit} className="space-y-4 p-5">
          <ErrorNote message={error} />
          <div>
            <label htmlFor="bookingUrl" className="mb-1.5 block text-sm text-zinc-300">
              Google Calendar booking link
            </label>
            <input id="bookingUrl" name="bookingUrl" type="url" defaultValue={links.bookingUrl} placeholder="https://calendar.app.google/…" className={input} />
            <p className="mt-1.5 text-xs text-zinc-500">
              The “Book a Call” button opens this page in a new tab. In Google Calendar choose <em>Create → Appointment schedule</em>, set your hours, then copy the booking page link. Leave empty to send visitors to the contact form instead.
            </p>
          </div>
          <div>
            <label htmlFor="telegramUrl" className="mb-1.5 block text-sm text-zinc-300">
              Telegram username or link
            </label>
            <input id="telegramUrl" name="telegramUrl" defaultValue={links.telegramUrl} placeholder="@yourusername or https://t.me/yourusername" className={input} />
            <p className="mt-1.5 text-xs text-zinc-500">The chat bubble in the bottom-right corner opens this chat. Leave empty to send visitors to the contact form instead.</p>
          </div>
          <div>
            <label htmlFor="portfolioUrl" className="mb-1.5 block text-sm text-zinc-300">
              Portfolio link
            </label>
            <input id="portfolioUrl" name="portfolioUrl" type="text" inputMode="url" defaultValue={links.portfolioUrl} placeholder="https://behance.net/yourname" className={input} />
            <p className="mt-1.5 text-xs text-zinc-500">The “See More Case Studies” button opens this page (your Behance, Dribbble or portfolio site) in a new tab. Leave empty to send visitors to the contact form instead.</p>
          </div>
          <fieldset className="space-y-4 border-t border-white/10 pt-4">
            <legend className="text-sm text-white">Footer social buttons</legend>
            <p className="-mt-1 text-xs text-zinc-500">
              Each button at the bottom of the website opens the profile you enter here, in a new tab. Telegram uses the Telegram field above. A button with no address is hidden, so visitors never see one that goes nowhere.
            </p>
            {SOCIAL_FIELDS.map((f) => (
              <div key={f.key}>
                <label htmlFor={f.key} className="mb-1.5 block text-sm text-zinc-300">
                  {f.label}
                </label>
                <input id={f.key} name={f.key} type="text" defaultValue={links[f.key]} placeholder={f.placeholder} className={input} />
              </div>
            ))}
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy ? "Saving…" : "Save links"}
            </button>
            {links.bookingUrl && (
              <a href={links.bookingUrl} target="_blank" rel="noopener noreferrer" className={btn}>
                Test booking ↗
              </a>
            )}
            {links.telegramUrl && (
              <a href={links.telegramUrl} target="_blank" rel="noopener noreferrer" className={btn}>
                Test Telegram ↗
              </a>
            )}
            {SOCIAL_FIELDS.filter((f) => links[f.key]).map((f) => (
              <a key={f.key} href={links[f.key]} target="_blank" rel="noopener noreferrer" className={btn}>
                Test {f.label} ↗
              </a>
            ))}
            {links.portfolioUrl && (
              <a href={links.portfolioUrl} target="_blank" rel="noopener noreferrer" className={btn}>
                Test portfolio ↗
              </a>
            )}
          </div>
          {saved && (
            <p role="status" className="text-sm text-emerald-400">
              Saved. The website updates on the next page load.
            </p>
          )}
        </form>
      )}
    </Card>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [excluded, setExcluded] = useState(isOptedOut);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (data.get("newPassword") !== data.get("confirm")) {
      setError("The new passwords do not match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/password", {
        method: "POST",
        body: { currentPassword: data.get("currentPassword"), newPassword: data.get("newPassword") },
      });
      // The server invalidates every existing session after a password change.
      adminToken.clear();
      router.replace("/admin/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Website links and your admin account." />
      <ContactLinksCard />
      <Card title="Change password" className="mt-6 max-w-[520px]">
        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <ErrorNote message={error} />
          <div>
            <label htmlFor="currentPassword" className="mb-1.5 block text-sm text-zinc-300">
              Current password
            </label>
            <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" className={input} />
          </div>
          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-sm text-zinc-300">
              New password
            </label>
            <input id="newPassword" name="newPassword" type="password" required minLength={10} autoComplete="new-password" className={input} />
            <p className="mt-1.5 text-xs text-zinc-500">At least 10 characters.</p>
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm text-zinc-300">
              Confirm new password
            </label>
            <input id="confirm" name="confirm" type="password" required minLength={10} autoComplete="new-password" className={input} />
          </div>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Updating…" : "Update password"}
          </button>
          <p className="text-xs text-zinc-500">You will be signed out everywhere and asked to sign in again.</p>
        </form>
      </Card>
      <Card title="Visitor tracking" className="mt-6 max-w-[520px]">
        <div className="flex items-start gap-4 p-5">
          <Switch
            checked={excluded}
            onChange={(v) => {
              setTrackingOptOut(v);
              setExcluded(v);
            }}
            label="Exclude this browser from visitor tracking"
          />
          <div className="text-sm">
            <p className="text-white">Exclude this browser</p>
            <p className="mt-1 text-zinc-400">Your own visits are not counted in analytics. This is turned on automatically when you sign in, and applies to this browser only.</p>
          </div>
        </div>
      </Card>
    </>
  );
}
