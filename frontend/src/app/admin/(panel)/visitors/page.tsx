"use client";

import { useCallback, useEffect, useState } from "react";
import { api, downloadCsv, type Page, type Visitor, type VisitorDetail } from "@/lib/admin-api";
import { btn, btnDanger, Card, countryLabel, ErrorNote, formatDate, formatDuration, input, PageHeader, Pagination, timeAgo, useDebounced } from "@/components/admin/common";

const ONLINE_MS = 5 * 60_000;
const isOnline = (iso: string) => Date.now() - Date.parse(iso) < ONLINE_MS;

const CTA_LABELS: Record<string, string> = {
  cta_book_call: "Clicked “Book a Call”",
  cta_lets_chat: "Clicked “Let’s Chat”",
  cta_our_portfolio: "Clicked “Our Portfolio”",
  cta_start_project: "Clicked “Start a Project”",
  cta_more_case_studies: "Clicked “See More Case Studies”",
  cta_clients_feedback: "Clicked “Our Clients Feedback”",
  cta_telegram: "Clicked the Telegram chat bubble",
};

function describeEvent(e: VisitorDetail["events"][number]) {
  switch (e.name) {
    case "pageview":
      return `Viewed ${e.path ?? "/"}`;
    case "scroll":
      return `Scrolled to ${e.label}%`;
    case "section_view":
      return `Viewed the “${e.label}” section`;
    case "inquiry":
      return `Submitted the inquiry form${e.label ? ` (budget ${e.label})` : ""}`;
    case "subscribe":
      return "Subscribed to the newsletter";
    case "social_click":
      return `Opened ${e.label ?? "a social"} link`;
    case "work_click":
      return `Opened project “${e.label ?? ""}”`;
    case "outbound":
      return `Clicked external link ${e.label ?? ""}`;
    default:
      return CTA_LABELS[e.name] ?? `${e.name}${e.label ? `: ${e.label}` : ""}`;
  }
}

function who(v: Visitor) {
  return v.lead?.inquiry?.name ?? v.lead?.inquiry?.email ?? v.lead?.subscriber?.email ?? null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-zinc-200">{children || <span className="text-zinc-600">—</span>}</dd>
    </div>
  );
}

function VisitorDrawer({ id, onClose, onDeleted }: { id: string; onClose: () => void; onDeleted: () => void }) {
  const [detail, setDetail] = useState<VisitorDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<VisitorDetail>(`/analytics/visitors/${id}`)
      .then(setDetail)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function erase() {
    if (!window.confirm("Permanently delete this visitor and all of their recorded sessions and events?")) return;
    try {
      await api(`/analytics/visitors/${id}`, { method: "DELETE" });
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    }
  }

  const v = detail?.visitor;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close details" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label="Visitor details" className="relative h-full w-full max-w-[560px] overflow-y-auto border-l border-white/10 bg-[#0e0e11] p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-xl text-white">{v ? (who(v) ?? "Anonymous visitor") : "Visitor"}</h2>
            {v && (
              <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                <i className={`size-2 rounded-full ${isOnline(v.lastSeen) ? "bg-emerald-400" : "bg-zinc-600"}`} />
                {isOnline(v.lastSeen) ? "Online now" : `Last seen ${timeAgo(v.lastSeen)}`} · ID {v.id.slice(0, 8)}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className={btn}>
            Close
          </button>
        </div>

        <ErrorNote message={error} />
        {!detail || !v ? (
          !error && <p className="text-sm text-zinc-400">Loading…</p>
        ) : (
          <div className="space-y-6">
            {detail.lead && (
              <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
                <p className="mb-1 text-emerald-300">Became a lead</p>
                {detail.lead.inquiry && (
                  <p className="text-zinc-200">
                    Inquiry from {detail.lead.inquiry.name} ·{" "}
                    <a className="text-violet-300 hover:underline" href={`mailto:${detail.lead.inquiry.email}`}>
                      {detail.lead.inquiry.email}
                    </a>
                  </p>
                )}
                {detail.lead.subscriber && <p className="text-zinc-200">Newsletter subscriber · {detail.lead.subscriber.email}</p>}
              </section>
            )}

            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Field label="Location">{[countryLabel(v.country) !== "Unknown" ? countryLabel(v.country) : null, v.city].filter(Boolean).join(" · ")}</Field>
              <Field label="Time zone">{v.timezone}</Field>
              <Field label="Device">{`${v.device} · ${v.browser} · ${v.os}`}</Field>
              <Field label="Screen">{v.screen}</Field>
              <Field label="Language">{v.language}</Field>
              <Field label="IP address">{v.ip}</Field>
              <Field label="First seen">{formatDate(v.firstSeen)}</Field>
              <Field label="Last seen">{formatDate(v.lastSeen)}</Field>
              <Field label="Sessions">{v.sessions}</Field>
              <Field label="Page views">{v.pageviews}</Field>
              <Field label="First source">{v.firstSource}</Field>
              <Field label="First referrer">{v.firstReferrer}</Field>
              <Field label="Landing page">{v.firstLanding}</Field>
              <Field label="Campaign">{[v.utmSource, v.utmMedium, v.utmCampaign].filter(Boolean).join(" / ")}</Field>
            </dl>

            <section>
              <h3 className="mb-3 text-sm text-white">Activity</h3>
              {detail.sessions.length === 0 ? (
                <p className="text-sm text-zinc-500">No sessions recorded.</p>
              ) : (
                <ol className="space-y-4">
                  {detail.sessions.map((s) => (
                    <li key={s.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm text-white">{formatDate(s.startedAt)}</p>
                      <p className="mb-3 text-xs text-zinc-500">
                        {s.source ?? "Direct"} · {s.pageviews} page view{s.pageviews === 1 ? "" : "s"} · {formatDuration(s.seconds)}
                      </p>
                      <ul className="space-y-1.5 border-l border-white/10 pl-3 text-sm">
                        {detail.events
                          .filter((e) => e.sessionId === s.id)
                          .reverse()
                          .map((e, i) => (
                            <li key={i} className="flex justify-between gap-3">
                              <span className="text-zinc-300">{describeEvent(e)}</span>
                              <span className="shrink-0 text-xs text-zinc-600">{new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                            </li>
                          ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <div className="border-t border-white/10 pt-5">
              <button type="button" onClick={erase} className={btnDanger}>
                Delete visitor data
              </button>
              <p className="mt-2 text-xs text-zinc-500">Removes this visitor&apos;s tracking history (for privacy requests). Any inquiry they sent is kept.</p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function VisitorsPage() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [device, setDevice] = useState("");
  const [source, setSource] = useState("");
  const [converted, setConverted] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<Visitor> | null>(null);
  const [filters, setFilters] = useState<{ countries: string[]; devices: string[]; sources: string[] }>({ countries: [], devices: [], sources: [] });
  const [error, setError] = useState<string | null>(null);
  // Deep link from other screens: /admin/visitors?visitor=<id> (this page only renders after sign-in, so window exists).
  const [openId, setOpenId] = useState<string | null>(() => new URLSearchParams(window.location.search).get("visitor"));
  const dq = useDebounced(q);

  const query = useCallback(
    (extra: Record<string, string> = {}) => new URLSearchParams({ q: dq, country, device, source, converted, ...extra }).toString(),
    [dq, country, device, source, converted],
  );

  const load = useCallback(() => {
    api<Page<Visitor>>(`/analytics/visitors?${query({ page: String(page), limit: "15" })}`)
      .then((d) => (setData(d), setError(null)))
      .catch((e) => setError(e.message));
  }, [query, page]);

  useEffect(load, [load]);

  useEffect(() => {
    api<typeof filters>("/analytics/visitors/filters").then(setFilters).catch(() => {});
  }, []);

  const reset = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    set(e.target.value);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Visitors"
        description="Every person who visited the site, with their device, location, source and activity."
        actions={
          <button type="button" className={btn} onClick={() => downloadCsv(`/analytics/visitors/export?${query()}`, "visitors.csv").catch((e) => setError(e.message))}>
            Export CSV
          </button>
        }
      />
      <ErrorNote message={error} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_150px_140px_160px_150px]">
        <input type="search" aria-label="Search visitors" placeholder="Search name, email, country, browser, IP…" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} className={input} />
        <select aria-label="Filter by country" value={country} onChange={reset(setCountry)} className={input}>
          <option value="">All countries</option>
          {filters.countries.map((c) => (
            <option key={c} value={c} className="bg-zinc-900">
              {countryLabel(c)}
            </option>
          ))}
        </select>
        <select aria-label="Filter by device" value={device} onChange={reset(setDevice)} className={input}>
          <option value="">All devices</option>
          {filters.devices.map((d) => (
            <option key={d} value={d} className="bg-zinc-900">
              {d}
            </option>
          ))}
        </select>
        <select aria-label="Filter by source" value={source} onChange={reset(setSource)} className={input}>
          <option value="">All sources</option>
          {filters.sources.map((s) => (
            <option key={s} value={s} className="bg-zinc-900">
              {s}
            </option>
          ))}
        </select>
        <select aria-label="Filter by lead status" value={converted} onChange={reset(setConverted)} className={input}>
          <option value="">Everyone</option>
          <option value="yes">Became a lead</option>
          <option value="no">No lead</option>
        </select>
      </div>

      <Card>
        {!data ? (
          <p className="p-5 text-sm text-zinc-400">Loading…</p>
        ) : data.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-400">No visitors match. New visits appear here as soon as someone opens the website.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 font-semibold">Visitor</th>
                  <th className="px-5 py-3 font-semibold">Location</th>
                  <th className="px-5 py-3 font-semibold">Device</th>
                  <th className="px-5 py-3 font-semibold">Source</th>
                  <th className="px-5 py-3 font-semibold">Visits</th>
                  <th className="px-5 py-3 font-semibold">Last seen</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.items.map((v) => (
                  <tr key={v.id} className="hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5">
                      <p className="flex items-center gap-2 text-white">
                        <i className={`size-2 shrink-0 rounded-full ${isOnline(v.lastSeen) ? "bg-emerald-400" : "bg-zinc-600"}`} />
                        {who(v) ?? "Anonymous"}
                        {v.lead && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] leading-none text-emerald-300">Lead</span>}
                      </p>
                      <p className="text-xs text-zinc-500">{v.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">
                      {countryLabel(v.country) !== "Unknown" ? countryLabel(v.country) : <span className="text-zinc-500">{v.timezone ?? "Unknown"}</span>}
                      {v.city && <p className="text-xs text-zinc-500">{v.city}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">
                      <span className="capitalize">{v.device}</span>
                      <p className="text-xs text-zinc-500">
                        {v.browser} · {v.os}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">{v.firstSource ?? "Direct"}</td>
                    <td className="px-5 py-3.5 text-zinc-300">
                      {v.sessions} <span className="text-zinc-500">· {v.pageviews} views</span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400" title={formatDate(v.lastSeen)}>
                      {timeAgo(v.lastSeen)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button type="button" className={btn} onClick={() => setOpenId(v.id)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}
      </Card>

      {openId && (
        <VisitorDrawer
          key={openId}
          id={openId}
          onClose={() => setOpenId(null)}
          onDeleted={() => {
            setOpenId(null);
            load();
          }}
        />
      )}
    </>
  );
}
