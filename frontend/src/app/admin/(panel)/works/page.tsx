/* eslint-disable @next/next/no-img-element -- admin previews show arbitrary hosts (API uploads + bundled images) */
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, type WorkItem } from "@/lib/admin-api";
import { btn, btnDanger, btnPrimary, ErrorNote, input, Modal, PageHeader, Switch } from "@/components/admin/common";

const MAX_BYTES = 5 * 1024 * 1024;

const TYPES = ["image/png", "image/jpeg", "image/webp"];

function WorkForm({ work, onClose, onSaved }: { work: WorkItem | null; onClose: () => void; onSaved: () => void }) {
  const [published, setPublished] = useState(work?.published ?? true);
  const [preview, setPreview] = useState<string | null>(work?.src ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function onFile(file: File | undefined) {
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError("Choose a PNG, JPEG or WebP image");
    if (file.size > MAX_BYTES) return setError("Image must be 5 MB or smaller");
    setError(null);
    setPreview((old) => {
      if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = form.get("image") as File;
    if (!work && !file?.size) return setError("Choose an image to upload");
    if (!file?.size) form.delete("image"); // editing without replacing the image
    form.set("published", String(published));
    setBusy(true);
    setError(null);
    try {
      await api(work ? `/works/${work.id}` : "/works", { method: work ? "PATCH" : "POST", body: form });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setBusy(false);
    }
  }

  return (
    <Modal title={work ? "Edit work" : "Add work"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorNote message={error} />
        {preview && <img src={preview} alt="Preview" className="aspect-[640/500] w-full rounded-xl border border-white/10 object-cover" />}
        <div>
          <label htmlFor="image" className="mb-1.5 block text-sm text-zinc-300">
            {work ? "Replace image (optional)" : "Image"}
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept={TYPES.join(",")}
            onChange={(e) => onFile(e.target.files?.[0])}
            className="block w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-white/5 file:px-3 file:py-2 file:text-sm file:text-white"
          />
          <p className="mt-1.5 text-xs text-zinc-500">PNG, JPEG or WebP, up to 5 MB. Best at about 640×500 (landscape).</p>
        </div>
        <div>
          <label htmlFor="alt" className="mb-1.5 block text-sm text-zinc-300">
            Description (alt text)
          </label>
          <input id="alt" name="alt" required minLength={3} maxLength={200} defaultValue={work?.alt} className={input} placeholder="e.g. Sportsbook dashboard UI for Revobet" />
          <p className="mt-1.5 text-xs text-zinc-500">Describes the image for screen readers and search engines.</p>
        </div>
        <div>
          <label htmlFor="url" className="mb-1.5 block text-sm text-zinc-300">
            Project link (optional)
          </label>
          <input id="url" name="url" type="text" inputMode="url" maxLength={500} defaultValue={work?.url ?? ""} className={input} placeholder="https://behance.net/gallery/…" />
          <p className="mt-1.5 text-xs text-zinc-500">Visitors who click this project on the website go here (opens in a new tab). Leave empty and the card is not clickable.</p>
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

/** The project link, editable right on the card: saves when you press Enter or click away. */
function InlineLink({ work, onError }: { work: WorkItem; onError: (message: string | null) => void }) {
  const [value, setValue] = useState(work.url ?? "");
  const [saved, setSaved] = useState(work.url ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    if (state === "saving" || value.trim() === saved) return; // nothing changed, or a save is already running
    setState("saving");
    onError(null);
    try {
      // The server cleans the address up (adds https://, rejects anything that isn't a web link) and returns what it kept.
      const next = await api<WorkItem>(`/works/${work.id}`, { method: "PATCH", body: { url: value } });
      setValue(next.url ?? "");
      setSaved(next.url ?? "");
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch (err) {
      setState("error");
      onError(err instanceof Error ? err.message : "Could not save the link");
    }
  }

  return (
    <div>
      <label htmlFor={`url-${work.id}`} className="mb-1 flex items-center justify-between text-xs text-zinc-400">
        <span>Project link</span>
        <span aria-live="polite" className={state === "error" ? "text-red-400" : "text-emerald-400"}>
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : state === "error" ? "Not saved" : ""}
        </span>
      </label>
      <div className="flex gap-1.5">
        <input
          id={`url-${work.id}`}
          type="text"
          inputMode="url"
          maxLength={500}
          value={value}
          placeholder="https://… (makes the card clickable)"
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            void save(); // save right away; leaving the field (blur) saves too
          }}
          className={`${input} h-9 text-xs ${state === "error" ? "border-red-400/60" : ""}`}
        />
        {saved && (
          <a href={saved} target="_blank" rel="noopener noreferrer" aria-label="Open this link in a new tab" title={saved} className={`${btn} h-9 px-2.5`}>
            ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default function WorksPage() {
  const [items, setItems] = useState<WorkItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<WorkItem | "new" | null>(null);

  const load = useCallback(() => {
    api<{ items: WorkItem[] }>("/works")
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
    setItems(next);
    try {
      await api("/works/reorder", { method: "POST", body: { ids: next.map((w) => w.id) } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reorder");
      load();
    }
  }

  async function togglePublished(w: WorkItem, published: boolean) {
    setItems((cur) => cur && cur.map((x) => (x.id === w.id ? { ...x, published } : x)));
    try {
      await api(`/works/${w.id}`, { method: "PATCH", body: { published } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update");
      load();
    }
  }

  async function remove(w: WorkItem) {
    if (!window.confirm(`Delete this work?\n\n${w.alt}`)) return;
    try {
      await api(`/works/${w.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    }
  }

  return (
    <>
      <PageHeader
        title="Works"
        description="Portfolio images in the website's “Our Works” carousel. Order here is the order on the site."
        actions={
          <button type="button" className={btnPrimary} onClick={() => setEditing("new")}>
            Add work
          </button>
        }
      />
      <ErrorNote message={error} />
      {items && items.length > 0 && (
        <p className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
          <strong className="text-white">{items.filter((w) => w.url).length} of {items.length}</strong> projects have a link.{" "}
          {items.some((w) => w.url)
            ? "Visitors can click those cards to open the project in a new tab; cards without a link stay plain images."
            : "Visitors can only click a project card once it has a link, so paste each project's address into its card below (e.g. your Behance page or the live site)."}
        </p>
      )}

      {!items ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-white/10 p-8 text-center text-sm text-zinc-400">No works yet. Add your first one.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((w, i) => (
            <li key={w.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <img src={w.src} alt={w.alt} loading="lazy" className={`aspect-[640/500] w-full object-cover ${w.published ? "" : "opacity-40"}`} />
              <div className="space-y-3 p-4">
                <p className="line-clamp-2 min-h-[2.5rem] text-sm text-zinc-300">{w.alt}</p>
                <InlineLink work={w} onError={setError} />
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    <Switch checked={w.published} onChange={(v) => togglePublished(w, v)} label={`Published: ${w.alt}`} />
                    {w.published ? "Published" : "Hidden"}
                  </label>
                  <div className="flex gap-1">
                    <button type="button" className={`${btn} px-2.5 py-1.5`} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier">
                      ←
                    </button>
                    <button type="button" className={`${btn} px-2.5 py-1.5`} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move later">
                      →
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={`${btn} flex-1`} onClick={() => setEditing(w)}>
                    Edit
                  </button>
                  <button type="button" className={btnDanger} onClick={() => remove(w)}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <WorkForm
          work={editing === "new" ? null : editing}
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
