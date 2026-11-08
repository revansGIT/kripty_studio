/* eslint-disable @next/next/no-img-element -- admin previews show arbitrary hosts (API uploads + bundled images) */
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, apiUpload, type TestimonialItem } from "@/lib/admin-api";
import { btn, btnDanger, btnPrimary, Card, ErrorNote, input, Modal, PageHeader, Switch } from "@/components/admin/common";

const MAX_AVATAR = 5 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function Initial({ name }: { name: string }) {
  return (
    <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-white/10 text-lg text-white">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function TestimonialForm({ item, onClose, onSaved }: { item: TestimonialItem | null; onClose: () => void; onSaved: () => void }) {
  const [published, setPublished] = useState(item?.published ?? true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(item?.avatar ?? null);
  const [videoPreview, setVideoPreview] = useState<string | null>(item?.video ?? null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  function pick(kind: "avatar" | "video", file: File | undefined, input: HTMLInputElement) {
    if (!file) return;
    const [types, max, label] = kind === "avatar" ? [IMAGE_TYPES, MAX_AVATAR, "Avatar must be a PNG, JPEG or WebP image up to 5 MB"] : [VIDEO_TYPES, MAX_VIDEO, "Video must be an MP4 or WebM file up to 50 MB"];
    if (!types.includes(file.type) || file.size > max) {
      input.value = ""; // forget the rejected file so it is not submitted
      setError(`${label} (this file is ${mb(file.size)}).`);
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    if (kind === "avatar") setAvatarPreview((old) => (old?.startsWith("blob:") && URL.revokeObjectURL(old), url));
    else {
      setVideoPreview((old) => (old?.startsWith("blob:") && URL.revokeObjectURL(old), url));
      setRemoveVideo(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    for (const key of ["avatar", "video"]) if (!(form.get(key) as File)?.size) form.delete(key); // nothing chosen
    form.set("published", String(published));
    if (removeVideo) form.set("removeVideo", "true");
    setError(null);
    setProgress(0);
    try {
      await apiUpload(item ? `/testimonials/${item.id}` : "/testimonials", item ? "PATCH" : "POST", form, setProgress);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setProgress(null);
    }
  }

  const busy = progress !== null;
  const showVideo = videoPreview && !removeVideo;

  return (
    <Modal title={item ? "Edit testimonial" : "Add testimonial"} onClose={busy ? () => {} : onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorNote message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm text-zinc-300">
              Name
            </label>
            <input id="name" name="name" required minLength={2} maxLength={100} defaultValue={item?.name} className={input} />
          </div>
          <div>
            <label htmlFor="role" className="mb-1.5 block text-sm text-zinc-300">
              Role / company
            </label>
            <input id="role" name="role" required minLength={2} maxLength={120} defaultValue={item?.role} placeholder="CEO of Acme" className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="quote" className="mb-1.5 block text-sm text-zinc-300">
            Testimonial text
          </label>
          <textarea id="quote" name="quote" required minLength={10} maxLength={1200} rows={5} defaultValue={item?.quote} className={`${input} h-auto resize-y py-2`} />
        </div>

        <div>
          <label htmlFor="avatar" className="mb-1.5 block text-sm text-zinc-300">
            Photo {item && "(optional, replaces current)"}
          </label>
          <div className="flex items-center gap-4">
            {avatarPreview ? <img src={avatarPreview} alt="Photo preview" className="size-14 rounded-full object-cover" /> : <Initial name={item?.name || "?"} />}
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept={IMAGE_TYPES.join(",")}
              onChange={(e) => pick("avatar", e.target.files?.[0], e.target)}
              className="block w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-white/5 file:px-3 file:py-2 file:text-sm file:text-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="video" className="mb-1.5 block text-sm text-zinc-300">
            Preview video {item?.video && "(optional, replaces current)"}
          </label>
          {showVideo && (
            <video src={videoPreview} controls muted playsInline preload="metadata" className="mb-3 aspect-[350/345] w-[220px] rounded-xl border border-white/10 bg-black object-cover" />
          )}
          <input
            id="video"
            name="video"
            type="file"
            accept={VIDEO_TYPES.join(",")}
            onChange={(e) => pick("video", e.target.files?.[0], e.target)}
            className="block w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-white/5 file:px-3 file:py-2 file:text-sm file:text-white"
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            MP4 (H.264) or WebM, up to 50 MB. It plays on the website when this testimonial is in focus, and the slider moves on when it ends. Short clips (15–45 s) work best; a square-ish or vertical crop fits the card.
          </p>
          {item?.video && (
            <label className="mt-2 flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={removeVideo} onChange={(e) => setRemoveVideo(e.target.checked)} />
              Remove the current video
            </label>
          )}
        </div>

        <label className="flex items-center gap-3 text-sm text-zinc-300">
          <Switch checked={published} onChange={setPublished} label="Published" />
          Published on the website
        </label>

        {busy && (
          <div role="progressbar" aria-valuenow={progress ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-violet-500 transition-[width]" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-zinc-400">{progress === 100 ? "Processing…" : `Uploading… ${progress}%`}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} disabled={busy} className={btn}>
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

type Slideshow = { videoSeconds: number; quoteSeconds: number };

/** How long the website slider stays on each Client Story. */
function SlideTiming({ onError }: { onError: (message: string | null) => void }) {
  const [saved, setSaved] = useState<Slideshow | null>(null);
  const [wholeVideo, setWholeVideo] = useState(true);
  const [videoSeconds, setVideoSeconds] = useState("10");
  const [quoteSeconds, setQuoteSeconds] = useState("6");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const apply = useCallback((s: Slideshow) => {
    setSaved(s);
    setWholeVideo(s.videoSeconds === 0);
    if (s.videoSeconds > 0) setVideoSeconds(String(s.videoSeconds));
    setQuoteSeconds(String(s.quoteSeconds));
  }, []);

  useEffect(() => {
    api<Slideshow>("/slideshow")
      .then(apply)
      .catch((e) => onError(e.message));
  }, [apply, onError]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setDone(false);
    onError(null);
    try {
      apply(await api<Slideshow>("/slideshow", { method: "PUT", body: { videoSeconds: wholeVideo ? 0 : videoSeconds, quoteSeconds } }));
      setDone(true);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Slider timing" className="mb-6">
      {!saved ? (
        <p className="p-5 text-sm text-zinc-400">Loading…</p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-5 p-5 md:grid-cols-2" onChange={() => setDone(false)}>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-white">
              <input type="checkbox" checked={wholeVideo} onChange={(e) => setWholeVideo(e.target.checked)} className="size-4 accent-violet-500" />
              Play each video to the end
            </label>
            <label className="block text-sm text-zinc-300">
              Otherwise move to the next slide after (seconds)
              <input type="number" min={3} max={300} step={1} value={videoSeconds} disabled={wholeVideo} onChange={(e) => setVideoSeconds(e.target.value)} className={`${input} mt-1.5 disabled:opacity-40`} />
            </label>
            <p className="text-xs text-zinc-500">3–300 s. A video shorter than this still moves on when it finishes.</p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-zinc-300">
              Slides without a video stay for (seconds)
              <input type="number" min={2} max={120} step={1} value={quoteSeconds} onChange={(e) => setQuoteSeconds(e.target.value)} required className={`${input} mt-1.5`} />
            </label>
            <p className="text-xs text-zinc-500">2–120 s. The text of the testimonial is shown for this long.</p>
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy ? "Saving…" : "Save timing"}
            </button>
            {done && (
              <span role="status" className="text-sm text-emerald-400">
                Saved. The website uses it right away.
              </span>
            )}
          </div>
        </form>
      )}
    </Card>
  );
}

export default function TestimonialsPage() {
  const [items, setItems] = useState<TestimonialItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<TestimonialItem | "new" | null>(null);

  const load = useCallback(() => {
    api<{ items: TestimonialItem[] }>("/testimonials")
      .then((d) => (setItems(d.items), setError(null)))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function move(index: number, dir: -1 | 1) {
    if (!items) return;
    const next = [...items];
    [next[index], next[index + dir]] = [next[index + dir], next[index]];
    setItems(next);
    try {
      await api("/testimonials/reorder", { method: "POST", body: { ids: next.map((t) => t.id) } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reorder");
      load();
    }
  }

  async function togglePublished(t: TestimonialItem, published: boolean) {
    setItems((cur) => cur && cur.map((x) => (x.id === t.id ? { ...x, published } : x)));
    try {
      await api(`/testimonials/${t.id}`, { method: "PATCH", body: { published } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update");
      load();
    }
  }

  async function remove(t: TestimonialItem) {
    if (!window.confirm(`Delete the testimonial from ${t.name}? Its photo and video are deleted too.`)) return;
    try {
      await api(`/testimonials/${t.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    }
  }

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Client Stories on the website. The card in focus plays its video, then the slider moves to the next one. Order here is the order on the site."
        actions={
          <button type="button" className={btnPrimary} onClick={() => setEditing("new")}>
            Add testimonial
          </button>
        }
      />
      <ErrorNote message={error} />

      <SlideTiming onError={setError} />

      <Card>
        {!items ? (
          <p className="p-5 text-sm text-zinc-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-400">No testimonials yet. Add your first one.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {items.map((t, i) => (
              <li key={t.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                <div className="flex flex-col gap-1">
                  <button type="button" className={`${btn} px-2.5 py-1.5`} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${t.name} up`}>
                    ↑
                  </button>
                  <button type="button" className={`${btn} px-2.5 py-1.5`} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${t.name} down`}>
                    ↓
                  </button>
                </div>
                {t.avatar ? <img src={t.avatar} alt="" className="size-14 shrink-0 rounded-full object-cover" /> : <Initial name={t.name} />}
                <div className={`min-w-[240px] flex-1 ${t.published ? "" : "opacity-50"}`}>
                  <p className="text-sm text-white">
                    {t.name} <span className="text-zinc-500">· {t.role}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{t.quote}</p>
                  <p className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs leading-none ring-1 ring-inset ${t.video ? "bg-violet-500/15 text-violet-300 ring-violet-400/30" : "bg-white/5 text-zinc-500 ring-white/10"}`}>
                    {t.video ? "Has video" : "No video, shows text for a few seconds"}
                  </p>
                </div>
                {t.video && <video src={`${t.video}#t=0.1`} muted playsInline preload="metadata" className="aspect-[350/345] w-[84px] rounded-lg border border-white/10 bg-black object-cover" />}
                <div className="flex items-center gap-3">
                  <Switch checked={t.published} onChange={(v) => togglePublished(t, v)} label={`Published: ${t.name}`} />
                  <button type="button" className={btn} onClick={() => setEditing(t)}>
                    Edit
                  </button>
                  <button type="button" className={btnDanger} onClick={() => remove(t)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && (
        <TestimonialForm
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
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
