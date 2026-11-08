"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Overview } from "@/lib/admin-api";
import { BarChart, BarList, Card, countryLabel, ErrorNote, formatDuration, PageHeader } from "@/components/admin/common";

const RANGES = [7, 30, 90] as const;

const ACTION_NAMES: Record<string, string> = {
  cta_book_call: "Clicked “Book a Call”",
  cta_lets_chat: "Clicked “Let’s Chat”",
  cta_our_portfolio: "Clicked “Our Portfolio”",
  cta_start_project: "Clicked “Start a Project”",
  cta_more_case_studies: "Clicked “See More Case Studies”",
  cta_clients_feedback: "Clicked “Our Clients Feedback”",
  cta_telegram: "Clicked the Telegram chat bubble",
  inquiry: "Submitted inquiry form",
  subscribe: "Subscribed to newsletter",
  outbound: "Clicked external link",
};

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl leading-none text-white">{value}</p>
      {hint && <p className="mt-2 text-xs text-zinc-500">{hint}</p>}
    </Card>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const load = () =>
      api<Overview>(`/analytics/overview?days=${days}`)
        .then((d) => live && (setData(d), setError(null)))
        .catch((e) => live && setError(e.message));
    load();
    const id = setInterval(load, 30_000); // keep "online now" fresh
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [days]);

  const t = data?.totals;
  const noCountries = data && data.countries.every((c) => c.label === "Unknown");

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Who visits the website, where they come from and what they do. Dates are in UTC."
        actions={
          <div role="group" aria-label="Date range" className="flex rounded-lg border border-white/15 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={days === r}
                onClick={() => setDays(r)}
                className={`rounded-md px-3 py-1.5 text-sm ${days === r ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                {r} days
              </button>
            ))}
          </div>
        }
      />
      <ErrorNote message={error} />

      {!data || !t ? (
        !error && <p className="text-sm text-zinc-400">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Visitors" value={t.visitors} hint={`${t.newVisitors} new · ${t.returningVisitors} returning`} />
            <Stat label="Page views" value={t.pageviews} hint={`${t.sessions} sessions`} />
            <Stat label="Avg. session" value={formatDuration(t.avgSessionSeconds)} hint={t.bounceRate === null ? undefined : `${t.bounceRate}% bounce rate`} />
            <Stat label="Leads" value={t.leads} hint={t.conversionRate === null ? "Inquiries + subscribers" : `${t.conversionRate}% of visitors converted`} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <Card title={`Last ${days} days`}>
              <BarChart
                data={data.series}
                series={[
                  { key: "visitors", label: "Visitors" },
                  { key: "pageviews", label: "Page views" },
                  { key: "leads", label: "Leads" },
                ]}
              />
            </Card>
            <Card
              title="Online now"
              action={
                <span className="flex items-center gap-2 text-sm text-emerald-400">
                  <i className={`size-2 rounded-full ${t.online ? "animate-pulse bg-emerald-400" : "bg-zinc-600"}`} />
                  {t.online}
                </span>
              }
            >
              {data.live.length === 0 ? (
                <p className="p-5 text-sm text-zinc-500">Nobody is on the site right now.</p>
              ) : (
                <ul className="divide-y divide-white/10">
                  {data.live.map((v) => (
                    <li key={v.id}>
                      <Link href={`/admin/visitors?visitor=${v.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-white/[0.03]">
                        <span className="min-w-0">
                          <span className="block truncate text-white">{countryLabel(v.country)}{v.city ? ` · ${v.city}` : ""}</span>
                          <span className="block truncate text-xs text-zinc-500">
                            {v.device} · {v.browser}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-zinc-400">{v.page ?? "/"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Card title="Traffic sources (sessions)">
              <BarList rows={data.sources} />
            </Card>
            <Card title="Campaigns (UTM)">
              {data.campaigns.length === 0 ? (
                <p className="p-5 text-sm text-zinc-500">No tagged campaigns yet. Add <code className="text-zinc-300">?utm_source=…&amp;utm_campaign=…</code> to the links you share.</p>
              ) : (
                <BarList rows={data.campaigns} />
              )}
            </Card>
            <Card title="Top pages">
              <BarList rows={data.pages} />
            </Card>
            <Card title="Countries">
              {noCountries ? (
                <p className="p-5 text-sm text-zinc-500">Country isn&apos;t available yet. It fills in automatically when the API runs behind Cloudflare, Vercel or CloudFront. Time zones are shown meanwhile.</p>
              ) : (
                <BarList rows={data.countries.map((c) => ({ ...c, label: countryLabel(c.label) }))} />
              )}
            </Card>
            <Card title="Time zones">
              <BarList rows={data.timezones} />
            </Card>
            <Card title="Languages">
              <BarList rows={data.languages} />
            </Card>
            <Card title="Devices">
              <BarList rows={data.devices.map((d) => ({ ...d, label: d.label[0].toUpperCase() + d.label.slice(1) }))} />
            </Card>
            <Card title="Browsers">
              <BarList rows={data.browsers} />
            </Card>
            <Card title="Operating systems">
              <BarList rows={data.systems} />
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Card title="Visitor actions">
              <BarList rows={data.actions.map((a) => ({ label: a.name === "work_click" ? `Opened project: ${a.label}` : a.name === "social_click" ? `Opened ${a.label}` : (ACTION_NAMES[a.name] ?? `${a.name}${a.label ? `: ${a.label}` : ""}`), count: a.count }))} />
            </Card>
            <Card title="Scroll depth (sessions)">
              <BarList rows={data.scroll.map((s) => ({ label: `Reached ${s.label}%`, count: s.count }))} />
            </Card>
            <Card title="Sections viewed (sessions)">
              <BarList rows={data.sections.map((s) => ({ label: s.label, count: s.count }))} />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
