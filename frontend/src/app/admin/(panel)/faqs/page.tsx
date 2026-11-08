"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, type FaqItem } from "@/lib/admin-api";
import { btn, btnDanger, btnPrimary, Card, ErrorNote, input, Modal, PageHeader, Switch } from "@/components/admin/common";

function FaqForm({ faq, onClose, onSaved }: { faq: FaqItem | null; onClose: () => void; onSaved: () => void }) {
  const [published, setPublished] = useState(faq?.published ?? true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api(faq ? `/faqs/${faq.id}` : "/faqs", {
        method: faq ? "PATCH" : "POST",
        body: { q: data.get("q"), a: data.get("a"), published },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setBusy(false);
    }
  }

  return (
    <Modal title={faq ? "Edit FAQ" : "Add FAQ"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorNote message={error} />
        <div>
          <label htmlFor="q" className="mb-1.5 block text-sm text-zinc-300">
            Question
          </label>
          <input id="q" name="q" required minLength={3} maxLength={300} defaultValue={faq?.q} className={input} />
        </div>
        <div>
          <label htmlFor="a" className="mb-1.5 block text-sm text-zinc-300">
            Answer
          </label>
          <textarea id="a" name="a" required minLength={3} maxLength={3000} rows={6} defaultValue={faq?.a} className={`${input} h-auto resize-y py-2`} />
        </div>
        <label className="flex items-center gap-3 text-sm text-zinc-300">
          <Switch checked={published} onChange={setPublished} label="Published" />
          Published on the website
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btn}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function FaqsPage() {
  const [items, setItems] = useState<FaqItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FaqItem | "new" | null>(null);

  const load = useCallback(() => {
    api<{ items: FaqItem[] }>("/faqs")
      .then((d) => {
        setItems(d.items);
        setError(null);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function move(index: number, dir: -1 | 1) {
    if (!items) return;
    const next = [...items];
    [next[index], next[index + dir]] = [next[index + dir], next[index]];
    setItems(next); // optimistic
    try {
      await api("/faqs/reorder", { method: "POST", body: { ids: next.map((f) => f.id) } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reorder");
      load();
    }
  }

  async function togglePublished(f: FaqItem, published: boolean) {
    setItems((cur) => cur && cur.map((x) => (x.id === f.id ? { ...x, published } : x)));
    try {
      await api(`/faqs/${f.id}`, { method: "PATCH", body: { published } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update");
      load();
    }
  }

  async function remove(f: FaqItem) {
    if (!window.confirm(`Delete this FAQ?\n\n${f.q}`)) return;
    try {
      await api(`/faqs/${f.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    }
  }

  return (
    <>
      <PageHeader
        title="FAQs"
        description="Questions shown in the website's FAQ section. Order here is the order on the site."
        actions={
          <button type="button" className={btnPrimary} onClick={() => setEditing("new")}>
            Add FAQ
          </button>
        }
      />
      <ErrorNote message={error} />

      <Card>
        {!items ? (
          <p className="p-5 text-sm text-zinc-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-400">No FAQs yet. Add your first one.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {items.map((f, i) => (
              <li key={f.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                <div className="flex flex-col gap-1">
                  <button type="button" className={`${btn} px-2.5 py-1.5`} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move "${f.q}" up`}>
                    ↑
                  </button>
                  <button type="button" className={`${btn} px-2.5 py-1.5`} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label={`Move "${f.q}" down`}>
                    ↓
                  </button>
                </div>
                <div className={`min-w-[240px] flex-1 ${f.published ? "" : "opacity-50"}`}>
                  <p className="text-sm text-white">{f.q}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{f.a}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={f.published} onChange={(v) => togglePublished(f, v)} label={`Published: ${f.q}`} />
                  <button type="button" className={btn} onClick={() => setEditing(f)}>
                    Edit
                  </button>
                  <button type="button" className={btnDanger} onClick={() => remove(f)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && (
        <FaqForm
          faq={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}
