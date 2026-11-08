"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, downloadCsv, type Inquiry, type InquiryStatus, type Page, type VisitorDetail } from "@/lib/admin-api";
import {
  BUDGET_LABELS,
  btn,
  btnDanger,
  btnPrimary,
  Card,
  countryLabel,
  ErrorNote,
  formatDate,
  input,
  PageHeader,
  Pagination,
  STATUS_META,
  STATUS_ORDER,
  StatusBadge,
  useDebounced,
} from "@/components/admin/common";

/** Where this lead came from, taken from the visitor tracking recorded before they submitted the form. */
function LeadSource({ id }: { id: string }) {
  const [detail, setDetail] = useState<VisitorDetail | "gone" | null>(null);
  useEffect(() => {
    api<VisitorDetail>(`/analytics/visitors/${id}`)
      .then(setDetail)
      .catch(() => setDetail("gone"));
  }, [id]);

  if (!detail) return null;
  if (detail === "gone") return <p className="mt-6 text-xs text-zinc-500">Visitor tracking data for this lead is no longer available.</p>;
  const v = detail.visitor;
  const place = [countryLabel(v.country) !== "Unknown" ? countryLabel(v.country) : null, v.city, v.timezone].filter(Boolean).join(" · ");
  return (
    <section className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
      <h3 className="mb-3 text-white">Lead source</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {[
          ["Came from", [v.firstSource ?? "Direct", v.utmCampaign].filter(Boolean).join(" · ")],
          ["Landing page", v.firstLanding],
          ["Location", place],
          ["Device", `${v.device} · ${v.browser} · ${v.os}`],
          ["Visits", `${v.sessions} session${v.sessions === 1 ? "" : "s"}, ${v.pageviews} page views`],
          ["First visit", formatDate(v.firstSeen)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-zinc-500">{label}</dt>
            <dd className="break-words text-zinc-200">{value || "—"}</dd>
          </div>
        ))}
      </dl>
      <Link href={`/admin/visitors?visitor=${v.id}`} className="mt-3 inline-block text-violet-300 hover:underline">
        Open visitor profile →
      </Link>
    </section>
  );
}

function InquiryDrawer({
  inquiry,
  onClose,
  onChanged,
  onDeleted,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onChanged: (i: Inquiry) => void;
  onDeleted: (id: string) => void;
}) {
  const [status, setStatus] = useState<InquiryStatus>(inquiry.status);
  const [notes, setNotes] = useState(inquiry.notes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = status !== inquiry.status || notes !== inquiry.notes;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const next = await api<Inquiry>(`/inquiries/${inquiry.id}`, { method: "PATCH", body: { status, notes } });
      onChanged(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!window.confirm(`Delete the inquiry from ${inquiry.name}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api(`/inquiries/${inquiry.id}`, { method: "DELETE" });
      onDeleted(inquiry.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
      setBusy(false);
    }
  }

  const tg = inquiry.telegram?.replace(/^@/, "");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close details" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label={`Inquiry from ${inquiry.name}`} className="relative flex h-full w-full max-w-[480px] flex-col overflow-y-auto border-l border-white/10 bg-[#0e0e11] p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl text-white">{inquiry.name}</h2>
            <p className="mt-1 text-xs text-zinc-500">Received {formatDate(inquiry.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} className={btn}>
            Close
          </button>
        </div>

        <ErrorNote message={error} />

        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-zinc-500">Email</dt>
            <dd>
              <a className="text-violet-300 hover:underline" href={`mailto:${inquiry.email}`}>
                {inquiry.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Telegram</dt>
            <dd>
              {tg ? (
                <a className="text-violet-300 hover:underline" href={`https://t.me/${encodeURIComponent(tg)}`} target="_blank" rel="noopener noreferrer">
                  @{tg}
                </a>
              ) : (
                <span className="text-zinc-500">—</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Budget</dt>
            <dd className="text-white">{BUDGET_LABELS[inquiry.budget] ?? inquiry.budget}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Project details</dt>
            <dd className="mt-1 whitespace-pre-wrap rounded-lg border border-white/10 bg-white/[0.03] p-3 text-zinc-200">{inquiry.details}</dd>
          </div>
        </dl>

        {inquiry.visitorId && <LeadSource id={inquiry.visitorId} />}

        <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm text-zinc-300">
              Status
            </label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as InquiryStatus)} className={input}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s} className="bg-zinc-900">
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm text-zinc-300">
              Internal notes
            </label>
            <textarea id="notes" rows={5} maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${input} h-auto resize-y py-2`} placeholder="Only visible to admins" />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={del} disabled={busy} className={btnDanger}>
            Delete
          </button>
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-emerald-400">Saved</span>}
            <button type="button" onClick={save} disabled={busy || !dirty} className={btnPrimary}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function InquiriesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [budget, setBudget] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<Inquiry> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const dq = useDebounced(q);

  const query = useCallback(
    (extra: Record<string, string> = {}) => new URLSearchParams({ q: dq, status, budget, ...extra }).toString(),
    [dq, status, budget],
  );

  const load = useCallback(() => {
    api<Page<Inquiry>>(`/inquiries?${query({ page: String(page), limit: "10" })}`)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e.message));
  }, [query, page]);

  useEffect(load, [load]);

  return (
    <>
      <PageHeader
        title="Inquiries"
        description="Project requests submitted through the contact form."
        actions={
          <button type="button" className={btn} onClick={() => downloadCsv(`/inquiries/export?${query()}`, "inquiries.csv").catch((e) => setError(e.message))}>
            Export CSV
          </button>
        }
      />
      <ErrorNote message={error} />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <input type="search" aria-label="Search inquiries" placeholder="Search name, email, details…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className={input} />
        <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={input}>
          <option value="">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s} className="bg-zinc-900">
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select aria-label="Filter by budget" value={budget} onChange={(e) => { setBudget(e.target.value); setPage(1); }} className={input}>
          <option value="">All budgets</option>
          {Object.entries(BUDGET_LABELS).map(([v, l]) => (
            <option key={v} value={v} className="bg-zinc-900">
              {l}
            </option>
          ))}
        </select>
      </div>

      <Card>
        {!data ? (
          <p className="p-5 text-sm text-zinc-400">Loading…</p>
        ) : data.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-400">No inquiries match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 font-semibold">Contact</th>
                  <th className="px-5 py-3 font-semibold">Budget</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Received</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.items.map((i) => (
                  <tr key={i.id} className="hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5">
                      <p className="text-white">{i.name}</p>
                      <p className="text-xs text-zinc-500">{i.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">{BUDGET_LABELS[i.budget] ?? i.budget}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">{formatDate(i.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button type="button" className={btn} onClick={() => setSelected(i)}>
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

      {selected && (
        <InquiryDrawer
          key={selected.id}
          inquiry={selected}
          onClose={() => setSelected(null)}
          onChanged={(next) => {
            setSelected(next);
            load();
          }}
          onDeleted={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </>
  );
}
