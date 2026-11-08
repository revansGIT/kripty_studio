"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Stats } from "@/lib/admin-api";
import { BUDGET_LABELS, Card, ErrorNote, formatDate, PageHeader, STATUS_META, STATUS_ORDER, StatusBadge } from "@/components/admin/common";

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl leading-none text-white">{value}</p>
      {hint && <p className="mt-2 text-xs text-zinc-500">{hint}</p>}
    </Card>
  );
}

/** Two-series bar chart (last 14 days) drawn with plain SVG. */
function ActivityChart({ series }: { series: Stats["series"] }) {
  const max = Math.max(1, ...series.flatMap((d) => [d.inquiries, d.subscribers]));
  const W = 700;
  const H = 180;
  const slot = W / series.length;
  const bar = 12;
  const y = (v: number) => H - (v / max) * (H - 10);
  return (
    <div className="px-5 pb-5 pt-4">
      <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label="Inquiries and subscribers over the last 14 days" className="w-full">
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1="0" x2={W} y1={y(max * t)} y2={y(max * t)} stroke="rgba(255,255,255,0.08)" />
        ))}
        {series.map((d, i) => {
          const x = i * slot + slot / 2;
          return (
            <g key={d.date}>
              <title>{`${d.date}: ${d.inquiries} inquiries, ${d.subscribers} subscribers`}</title>
              <rect x={x - bar - 1} y={y(d.inquiries)} width={bar} height={H - y(d.inquiries)} rx="3" fill="#8b5cf6" />
              <rect x={x + 1} y={y(d.subscribers)} width={bar} height={H - y(d.subscribers)} rx="3" fill="#34d399" />
              {i % 2 === 0 && (
                <text x={x} y={H + 16} textAnchor="middle" fontSize="11" fill="#71717a">
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex gap-5 text-xs text-zinc-400">
        <span className="flex items-center gap-2">
          <i className="size-2.5 rounded-sm bg-violet-500" /> Inquiries
        </span>
        <span className="flex items-center gap-2">
          <i className="size-2.5 rounded-sm bg-emerald-400" /> Subscribers
        </span>
      </div>
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3 p-5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[100px_1fr_28px] items-center gap-3 text-sm">
          <span className="text-zinc-400">{r.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full bg-violet-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="text-right text-white">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Stats>("/stats")
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your studio's leads and audience." />
      <ErrorNote message={error} />
      {!stats ? (
        !error && <p className="text-sm text-zinc-400">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total inquiries" value={stats.totals.inquiries} hint={`${stats.totals.inquiriesLast7Days} in the last 7 days`} />
            <StatCard label="Awaiting reply" value={stats.totals.newInquiries} hint="Inquiries with status New" />
            <StatCard label="Subscribers" value={stats.totals.subscribers} hint={`${stats.totals.subscribersLast7Days} in the last 7 days`} />
            <StatCard label="Win rate" value={stats.totals.winRate === null ? "—" : `${stats.totals.winRate}%`} hint="Won ÷ (Won + Lost)" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <Card title="Last 14 days">
              <ActivityChart series={stats.series} />
            </Card>
            <Card title="Pipeline">
              <Bars rows={STATUS_ORDER.map((s) => ({ label: STATUS_META[s].label, value: stats.byStatus[s] ?? 0 }))} />
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <Card
              title="Recent inquiries"
              action={
                <Link href="/admin/inquiries" className="text-sm text-violet-300 hover:text-violet-200">
                  View all
                </Link>
              }
            >
              {stats.recent.length === 0 ? (
                <p className="p-5 text-sm text-zinc-400">No inquiries yet. Submissions from the contact form will appear here.</p>
              ) : (
                <ul className="divide-y divide-white/10">
                  {stats.recent.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">{i.name}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {i.email} · {formatDate(i.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={i.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Budget ranges">
              <Bars rows={Object.entries(BUDGET_LABELS).map(([k, label]) => ({ label, value: stats.byBudget[k] ?? 0 }))} />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
