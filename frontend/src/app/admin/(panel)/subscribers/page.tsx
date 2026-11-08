"use client";

import { useCallback, useEffect, useState } from "react";
import { api, downloadCsv, type Page, type Subscriber } from "@/lib/admin-api";
import { btn, btnDanger, Card, ErrorNote, formatDate, input, PageHeader, Pagination, useDebounced } from "@/components/admin/common";

export default function SubscribersPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<Subscriber> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dq = useDebounced(q);

  const load = useCallback(() => {
    api<Page<Subscriber>>(`/subscribers?${new URLSearchParams({ q: dq, page: String(page), limit: "10" })}`)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e.message));
  }, [dq, page]);

  useEffect(load, [load]);

  async function remove(s: Subscriber) {
    if (!window.confirm(`Remove ${s.email} from the list?`)) return;
    try {
      await api(`/subscribers/${s.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    }
  }

  return (
    <>
      <PageHeader
        title="Subscribers"
        description="People who signed up for studio updates."
        actions={
          <button type="button" className={btn} onClick={() => downloadCsv("/subscribers/export", "subscribers.csv").catch((e) => setError(e.message))}>
            Export CSV
          </button>
        }
      />
      <ErrorNote message={error} />

      <div className="mb-4 max-w-sm">
        <input type="search" aria-label="Search subscribers" placeholder="Search email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className={input} />
      </div>

      <Card>
        {!data ? (
          <p className="p-5 text-sm text-zinc-400">Loading…</p>
        ) : data.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-400">No subscribers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Subscribed</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.items.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5 text-white">{s.email}</td>
                    <td className="px-5 py-3.5 text-zinc-400">{formatDate(s.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button type="button" className={btnDanger} onClick={() => remove(s)}>
                        Remove
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
    </>
  );
}
