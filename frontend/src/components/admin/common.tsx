"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { InquiryStatus } from "@/lib/admin-api";

export const STATUS_META: Record<InquiryStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-violet-500/15 text-violet-300 ring-violet-400/30" },
  contacted: { label: "Contacted", className: "bg-sky-500/15 text-sky-300 ring-sky-400/30" },
  in_progress: { label: "In progress", className: "bg-amber-500/15 text-amber-300 ring-amber-400/30" },
  won: { label: "Won", className: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30" },
  lost: { label: "Lost", className: "bg-zinc-500/15 text-zinc-300 ring-zinc-400/30" },
};

export const STATUS_ORDER = Object.keys(STATUS_META) as InquiryStatus[];

export const BUDGET_LABELS: Record<string, string> = {
  "<1k": "< $1K",
  "1k-5k": "$1K–$5K",
  "5k-10k": "$5K–$10K",
  "10k-20k": "$10K–$20K",
  "20k-50k": "$20K–$50K",
  ">50k": "> $50K",
};

export function StatusBadge({ status }: { status: InquiryStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.new;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs leading-none ring-1 ring-inset ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export function Card({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/[0.03] ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          {title && <h2 className="text-[15px] text-white">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-sm leading-none text-white transition hover:bg-white/10 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-3.5 py-2 text-sm leading-none text-white transition hover:bg-violet-500 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2 text-sm leading-none text-red-300 transition hover:bg-red-500/20 disabled:opacity-50";
export const input =
  "h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-400";

export function Pagination({ page, pages, total, onChange }: { page: number; pages: number; total: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-3 text-sm text-zinc-400">
      <span>
        {total} result{total === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </button>
        <span aria-live="polite">
          {page} / {pages}
        </span>
        <button className={btn} disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </p>
  );
}

/** Accessible modal: closes on Escape or backdrop click. */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative max-h-full w-full max-w-[560px] overflow-y-auto rounded-2xl border border-white/10 bg-[#0e0e11] p-6">
        <h2 className="mb-5 text-xl text-white">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${checked ? "bg-violet-600" : "bg-white/15"}`}
    >
      <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

// --- Analytics helpers ---

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

export function timeAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** Country code -> "🇧🇩 Bangladesh". Returns "Unknown" for missing/invalid codes. */
export function countryLabel(code: string | null | undefined) {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return "Unknown";
  const flag = String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
  let name = code.toUpperCase();
  try {
    name = new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? name;
  } catch {}
  return `${flag} ${name}`;
}

export function BarList({ rows, format = (v: number) => String(v) }: { rows: { label: string; count: number }[]; format?: (v: number) => string }) {
  if (rows.length === 0) return <p className="p-5 text-sm text-zinc-500">No data yet.</p>;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-3 p-5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(80px,1fr)_1.4fr_40px] items-center gap-3 text-sm">
          <span className="truncate text-zinc-300" title={r.label}>
            {r.label}
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full bg-violet-500" style={{ width: `${(r.count / max) * 100}%` }} />
          </span>
          <span className="text-right text-white">{format(r.count)}</span>
        </li>
      ))}
    </ul>
  );
}

export const SERIES_COLORS = ["#8b5cf6", "#38bdf8", "#34d399"];

/** Grouped bar chart drawn with plain SVG; bar width adapts to the number of days. */
export function BarChart({ data, series }: { data: Record<string, number | string>[]; series: { key: string; label: string }[] }) {
  const W = 760;
  const H = 190;
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]))));
  const slot = W / data.length;
  const bar = Math.max(2, (slot * 0.78) / series.length);
  const y = (v: number) => H - (v / max) * (H - 12);
  const labelEvery = Math.ceil(data.length / 10);
  return (
    <div className="px-5 pb-5 pt-4">
      <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label={`${series.map((s) => s.label).join(", ")} per day`} className="w-full">
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1="0" x2={W} y1={y(max * t)} y2={y(max * t)} stroke="rgba(255,255,255,0.08)" />
            <text x="2" y={y(max * t) - 3} fontSize="10" fill="#52525b">
              {Math.round(max * t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x0 = i * slot + (slot - bar * series.length) / 2;
          return (
            <g key={String(d.date)}>
              <title>{`${d.date}: ${series.map((s) => `${d[s.key]} ${s.label.toLowerCase()}`).join(", ")}`}</title>
              {series.map((s, n) => (
                <rect key={s.key} x={x0 + n * bar} y={y(Number(d[s.key]))} width={bar - 0.5} height={H - y(Number(d[s.key]))} rx="2" fill={SERIES_COLORS[n]} />
              ))}
              {i % labelEvery === 0 && (
                <text x={i * slot + slot / 2} y={H + 16} textAnchor="middle" fontSize="10" fill="#71717a">
                  {String(d.date).slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-5 text-xs text-zinc-400">
        {series.map((s, n) => (
          <span key={s.key} className="flex items-center gap-2">
            <i className="size-2.5 rounded-sm" style={{ background: SERIES_COLORS[n] }} /> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
