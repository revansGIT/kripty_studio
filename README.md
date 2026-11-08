# Kripty Studio — Landing Page

Built from the Figma design: `CP3Wo3oMxQSSLP8XqPwXFw`.

| Folder      | Stack                                               | Port |
| ----------- | --------------------------------------------------- | ---- |
| `frontend/` | Next.js 16 (App Router), React 19, Tailwind CSS 4   | 3000 |
| `backend/`  | Node.js, Express 5, Zod validation, Helmet, rate limit | 4000 |

## Run locally

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Env files: `frontend/.env.example` (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`) and `backend/.env.example` (`PORT`, `CORS_ORIGIN`, `MONGODB_URI`, `MONGODB_DB`, admin and tracking settings).

## API

- `GET  /api/health`
- `POST /api/contact` — `{ name, telegram?, email, budget, details }` (budget: `<1k | 1k-5k | 5k-10k | 10k-20k | 20k-50k | >50k`)
- `POST /api/subscribe` — `{ email }`

Everything is stored in MongoDB Atlas, see **Database** below.

## SEO

Static prerendered page with full metadata (title, description, canonical, Open Graph, Twitter), generated OG image, JSON-LD (Organization, WebSite, ProfessionalService, FAQPage), `sitemap.xml`, `robots.txt`, web manifest, semantic headings/landmarks and alt text.

## Fonts

The design uses **Gilroy** (commercial). The site loads Gilroy if it is available and falls back to **Urbanist** (Google Fonts). To self-host Gilroy, add the font files and an `@font-face` named `Gilroy` in `frontend/src/app/globals.css`.

## Admin panel (`/admin`)

Sign in at `http://localhost:3000/admin`. The account is created on the first API request from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env` (set `JWT_SECRET` too). After that the password is stored hashed (scrypt) in `backend/data/admin.json` and can be changed under **Settings** — changing it signs out every session.

Features: dashboard (totals, 14-day activity chart, pipeline, budget breakdown), inquiries (search, status/budget filters, pagination, status + internal notes, delete, CSV export), subscribers (search, remove, CSV export), password change.

Admin API (all except `login` need `Authorization: Bearer <token>`): `POST /api/admin/login`, `GET /api/admin/me`, `POST /api/admin/password`, `GET /api/admin/stats`, `GET|PATCH|DELETE /api/admin/inquiries[/:id]`, `GET /api/admin/inquiries/export`, `GET|DELETE /api/admin/subscribers[/:id]`, `GET /api/admin/subscribers/export`. Login is limited to 10 attempts per 15 minutes per IP. `/admin` is `noindex` and disallowed in `robots.txt`.

### Content management (FAQs & works)

`/admin/faqs` and `/admin/works` let you add, edit, hide/show, reorder and delete the website's FAQ entries and "Our Works" images. The first time the API starts it seeds both from the original design content.

- Uploads: PNG, JPEG or WebP up to 5 MB. The API checks the file's real bytes (not its name), stores it under `backend/uploads/` with a random name, and serves it at `/uploads/...`. Deleting or replacing a work removes the old file.
- The website reads content from `GET /api/content/faqs` and `GET /api/content/works` (published rows only) and caches it with the `content` tag. Saving in the admin calls `POST {FRONTEND_URL}/api/revalidate` with the shared `REVALIDATE_SECRET`, so changes show up on the next page load; without it the site refreshes within an hour.
- FAQ JSON-LD (rich results) is generated from the same data, so SEO stays in sync with what visitors see.
- If the API is unreachable when the site renders, the bundled default content is used instead.
- Env: `backend/.env` needs `PUBLIC_API_URL`, `FRONTEND_URL`, `REVALIDATE_SECRET`, `UPLOADS_DIR`; `frontend/.env.local` needs the same `REVALIDATE_SECRET`.

## Visitor tracking & analytics

The website records its own visitors (first-party, no third-party scripts) and the admin panel shows them.

- **`/admin/analytics`**: visitors, page views, sessions, average session time, bounce rate, new vs returning, leads and conversion rate; a daily chart (7/30/90 days); "online now"; traffic sources and UTM campaigns; top pages; countries, time zones, languages, devices, browsers, OS; CTA clicks, scroll depth (25/50/75/100%) and which sections were viewed.
- **`/admin/visitors`**: every visitor with device, location, source, visit count and last-seen time; search and filters (country, device, source, lead / no lead); CSV export. Click a visitor for their full profile and activity timeline, or delete their data.
- **Leads are linked to visitors**: when someone submits the contact form or subscribes, the inquiry stores their visitor id. The inquiry drawer shows a "Lead source" card (where they came from, landing page, device, location, visits) and the visitor profile shows the lead's name and email.

How it works: `Tracker` (root layout) sends beacons to `POST /api/track` for page views, CTA clicks (any element with `data-track="event_name"`), scroll milestones, section views and a 30-second heartbeat. An anonymous random id is kept in the browser's localStorage; a session ends after 30 minutes of inactivity. Data is stored in MongoDB (`visitors`, `sessions`, `events` collections), and anything older than `TRACK_RETENTION_DAYS` (default 395) is removed automatically by TTL indexes.

Privacy:
- Tracking is skipped for browsers that send Do Not Track / Global Privacy Control, for bots, and for the owner's own browser (signing in to `/admin` excludes it; toggle under **Settings**).
- IP addresses are stored with the last IPv4 octet (or IPv6 tail) removed. Set `TRACK_FULL_IP=true` to keep the full address.
- Depending on where your visitors live (e.g. EU/UK), you may need a privacy notice and/or a consent banner before tracking. Add it before launch.
- Country and city come from CDN headers (`cf-ipcountry`, `x-vercel-ip-country`, `cloudfront-viewer-country`, `x-vercel-ip-city`), so they fill in once the API is behind Cloudflare, Vercel or CloudFront. Set `TRUST_PROXY` (e.g. `1`) when the API sits behind a proxy so the real visitor IP is used. Time zone and language are always collected.
- Use **Delete visitor data** in a visitor's profile to honour an erasure request.

New env vars (backend): `TRUST_PROXY`, `TRACK_FULL_IP`, `TRACK_RETENTION_DAYS`.

### Client Stories: video previews & testimonials (`/admin/testimonials`)

Add, edit, hide/show, reorder and delete testimonials (name, role, text, optional photo, optional preview video). The first run seeds the three original ones.

- **On the website** the card in the centre plays its video (muted, inline). When the video ends the slider moves to the next card; a testimonial without a video shows its text for 6 seconds instead. The active dot fills as a progress bar, dots are clickable, and there is a pause/resume button plus a mute/unmute button on videos.
- Playback only runs while the section is on screen and the tab is visible; it pauses when you scroll away. With "reduce motion" enabled in the OS the slider does not autoplay and the video shows normal controls.
- **Video upload:** MP4 (H.264) or WebM, up to 50 MB; photo: PNG/JPEG/WebP up to 5 MB. Files are validated by their real bytes, streamed to disk, and served with range support (so seeking works). Replacing or deleting a testimonial removes its old files. The form shows an upload progress bar.
- Tips: short clips (15–45 s) with a square-ish or vertical crop fit the card (350×345). Compress videos before uploading; for production, store them on object storage/CDN instead of `backend/uploads/`.

- **Slider timing** (top of the same page, "Slider timing"): choose "Play each video to the end", or untick it and enter how many seconds each video plays before the slider moves on (3–300; a shorter video still moves on when it ends). A separate field sets how long slides without a video stay (2–120 s, default 6). Saved changes go live right away. API: `GET /api/content/slideshow`, `GET/PUT /api/admin/slideshow`.

## Database (MongoDB Atlas)

The API stores all data in MongoDB Atlas (database `MONGODB_DB`, default `kripty`). The connection string comes from `MONGODB_URI` in `backend/.env`. The Atlas onboarding file `atlas-credentials.env` (project root) holds the same value. **Keep it out of version control and never expose it to the frontend.**

| Collection | Contents |
| --- | --- |
| `inquiries`, `subscribers` | Leads from the website forms (`subscribers.email` has a unique index) |
| `faqs`, `works`, `testimonials` | Site content managed in the admin (seeded with the original content on first run) |
| `visitors`, `sessions`, `events` | Visitor analytics (TTL indexes delete data after `TRACK_RETENTION_DAYS`) |
| `docs`, `meta` | The admin account (hashed password) and one-time seeding markers |

- The server connects at startup and exits with a clear message if it can't. The most common cause is that your IP address isn't allowed under **Network Access** in Atlas. `GET /api/health` reports `database: connected`.
- Indexes are created automatically on start.
- **Uploaded images and videos are still files** in `backend/uploads/`, only their paths are stored in MongoDB. For production, keep that folder on persistent storage or move uploads to object storage (S3/R2) with a CDN.
- **Importing older local data:** the previous JSON files in `backend/data/` are no longer used. `npm run import:local` (in `backend/`) copies them into Atlas and never overwrites content edited in Atlas. It has already been run once. The old `data/` folder, including `analytics.db`, can be deleted once you no longer need it.
- Backups: enable Atlas Cloud Backup for production, and use a dedicated database user with only the permissions the app needs.

## Hero headline animation

The highlighted word in "We Create **Designs** that Drive Businesses Forward." flips vertically every ~3 seconds: the current word rotates away on the X axis while the next rotates in, and the purple box eases to the new word's width. The shine sweep and glow keep running on top.

- Words live in `HERO_WORDS` in `frontend/src/components/Hero.tsx` (currently Designs → Websites → Templates → Animations). Use plural nouns so the sentence stays grammatical; timing is `HOLD_MS` / `FLIP_MS` in `RotatingWord.tsx` (and `--rw-flip` in `globals.css`).
- SEO/accessibility: the server-rendered HTML always contains "We Create Designs that Drive Businesses Forward."; cycling starts after the page loads and is skipped for visitors who prefer reduced motion or while the tab is hidden.
- On phones the word sits on its own line so a longer word can never re-wrap the heading.

## Book a Call and the Telegram bubble

- **Book a Call** (header, desktop and mobile menu) opens your **Google Calendar booking page** in a new tab. Set it up in Google Calendar via *Create → Appointment schedule*, then copy the booking page link.
- A floating **Telegram bubble** sits in the bottom-right corner: it floats, sends out ripples, wiggles its paper plane, shows a "Chat on Telegram" label on hover, and after a few seconds a small greeting "types" a message (once per browser session; it can be dismissed). Clicking either opens your Telegram chat in a new tab.
- Both links are managed in **Admin → Settings → Contact links**: paste the Google Calendar link (only `calendar.app.google` / `calendar.google.com` https links are accepted) and your Telegram `@username` or `t.me` link (the server turns any of those forms into `https://t.me/...`). Changes show on the next page load.
- Until a link is set, the buttons fall back to the contact form, so nothing is ever a dead link. Clicks are tracked as `cta_book_call` and `cta_telegram` in Analytics.
- API: `GET /api/content/links` (public), `GET|PUT /api/admin/links`. The site picks up changes through the existing `/api/revalidate` hook, so keep `FRONTEND_URL` and `REVALIDATE_SECRET` set in production.

## "Trusted by" brand strip

The brand strip under the hero slides continuously **from left to right** in a seamless loop (about 45 s per cycle, pauses on hover, static for visitors who prefer reduced motion). It is pure CSS: no client JavaScript.

- Logos live in `frontend/public/images/brands/` (transparent PNGs) and are listed in `frontend/src/lib/brands.ts`. To add a brand, drop in a transparent PNG and add a line with its name and size. To change the speed edit `--brand-marquee-duration` in `globals.css` (`.brand-track`).
- All 11 brands from the design are included (the design only showed 9 of them, cut off at the edges): DLGBet, Arba777, Casino148, mines.gg, RogueBux, Krush, Race365, Sports Degens, Betsera, Spin and Gold Sweeps.
- Each logo has its own alt text; the repeated copies needed for the loop are hidden from screen readers and search engines.

## Scroll "curtain" effect (hero → dark panel)

When you scroll down from the first screen, the black "Our Works" panel rises over the hero like a curtain: the hero stays pinned and gently recedes (scales down to 93% and fades to 50%), while the panel slides up slightly faster than the scroll, widens from 95.5% to full width, and casts a soft shadow upwards. It runs with the scroll in both directions and completes exactly when the panel reaches the header.

- `frontend/src/components/CurtainScroll.tsx` sets one CSS variable (`--curtain`, 0-1) once per animation frame; the visuals are in `globals.css` (`.curtain-hero`, `.curtain-panel`). Tune the strength there (`80px` rise, `0.955` start width, `0.07` hero scale, `0.5` hero fade).
- The hero is pinned (sticky) on every screen size. When it is taller than the screen (phones, short windows) it is pinned by its bottom edge: it scrolls normally until its end is visible, then holds while the panel slides over it (`--hero-pin`, set by `CurtainScroll`). Visitors who prefer reduced motion get a plain scroll.
- Disabled for visitors who prefer reduced motion, and static when JavaScript is off.
- The hero is pinned only inside a wrapper that holds just the hero and the dark panel (`<div className="relative">` in `app/page.tsx`). Keep it that way: if the hero were pinned inside `<main>` it would stay behind the FAQ and contact sections too and show through them.

## Project links and the portfolio button

- **Each project in "Our Works" can link to its own page.** In **Admin → Works**, add or edit a work and fill **Project link**. Visitors who click that card (the whole card) open the link in a new tab, with a "View project" badge on hover. A work with an empty link stays a plain, non-clickable image.
- **"See More Case Studies"** opens your portfolio: set it in **Admin → Settings → Website links → Portfolio link** (Behance, Dribbble or your own site). Until it's set, the button goes to the contact form.
- You can type addresses without `https://` (e.g. `behance.net/gallery/123`); the server adds it. Only `http`/`https` links are accepted, so something like `javascript:` can never be saved.
- Clicks are tracked: **Analytics → Visitor actions** shows "Opened project: <name>" and "Clicked See More Case Studies"; each visitor's timeline shows which projects they opened.
- API: works carry a `url` (`GET /api/content/works`, `POST/PATCH /api/admin/works`); the portfolio link is `portfolioUrl` in `GET /api/content/links` and `PUT /api/admin/links` (saves are partial, so changing one link never clears the others).

## Footer social buttons

- The round buttons at the bottom of the site (Behance, Dribbble, Telegram, X, Instagram, Pinterest) are controlled in **Admin → Settings → Website links → Footer social buttons**.
- Type a profile link, a bare `@username`, or `instagram.com/yourname`; the server turns it into the full profile link and rejects a link that belongs to a different site (e.g. a Behance link in the Instagram box). Use **Test link** to open what you saved.
- A button only appears once its address is set; with none set, the whole row is hidden. Telegram shares the same address as the floating Telegram bubble.
- Buttons open in a new tab, are counted in Analytics ("Opened Instagram", etc.), and the saved profiles are also published to search engines as `sameAs` in the page's structured data.
- Works links can also be edited straight from the Works list (type in the card's link box, press Enter or click away).

## Services section animation

- The heading has a slow silver shimmer; the pill, heading and the three columns fade up as they scroll into view (`components/Reveal.tsx`, styles in `globals.css`).
- Two small lights travel along the dashed curves from icon 1 → 2 → 3 on a 6-second loop (SVG `animateMotion` in `components/Services.tsx`), and each icon glows as the light arrives. Icons also float gently and each glyph has its own motion (pen sketches, laptop pulses, ball bounces).
- All of it is switched off for visitors who prefer reduced motion, and the content is fully visible with JavaScript disabled.

## Troubleshooting (development)

- **"A tree hydrated but some attributes of the server rendered HTML didn't match" with `bis_skin_checked`, `bis_register` or `__processed_…` attributes:** this comes from a browser extension (e.g. Bitdefender TrafficLight, some password managers) that edits the page before React loads, not from the code. `<html>` and `<body>` already ignore such differences; to silence it fully, test in an incognito window or disable the extension for `localhost`. It is a development-only warning.
- The dev-only "instant navigation" validator is set to `manual-warning` in `next.config.ts`, because the sign-in-gated admin pages render on the client and would otherwise be flagged on every visit.
