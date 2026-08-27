# महाराष्ट्र एका नजरेत — Maharashtra in a Glance

A Marathi-first, mobile-first prototype for reading short AI-generated summaries
of Maharashtra development news, with the full article available as a PDF and as
an editable Word document.

**This is a frontend prototype.** The five articles it carries are real DGIPR
press releases of 26 August 2026, defined locally in `src/data/articles.ts`.
There is no backend, CMS, authentication, or admin interface.

---

## Running it

```bash
npm install
npm run dev            # http://localhost:3000
```

Other scripts:

| Command                    | What it does                                      |
| -------------------------- | ------------------------------------------------- |
| `npm run build`            | Production build                                  |
| `npm start`                | Serve the production build                        |
| `npm run lint`             | ESLint (Next core-web-vitals + React Compiler rules) |
| `npm run typecheck`        | `next typegen` then `tsc --noEmit`                |
| `npm test`                 | Vitest unit tests                                 |
| `npm run gen:posters`      | Regenerate the poster SVGs in `public/posters/`   |
| `npm run gen:pdfs`         | Print `/print/<slug>` to `public/pdfs/` (needs `npm run dev` running) |
| `npm run gen:docx`         | Write `public/docs/<slug>.docx` from the article data (no server needed) |

---

## Editing the content

Everything the visitor reads comes from **[`src/data/articles.ts`](src/data/articles.ts)**.
That file carries a checklist at the top. In short:

1. Append an object to `ARTICLES`. Keep `id` and `slug` unique — `slug` is what
   the `?article=` deep link addresses.
2. Point `posterImageUrl` at the poster. Local posters live in
   `public/posters/` and are produced by `npm run gen:posters` from the table in
   [`scripts/generate-posters.mjs`](scripts/generate-posters.mjs); an absolute
   URL needs its host added to `images.remotePatterns` in
   [`next.config.ts`](next.config.ts). `null` renders the designed fallback.
3. Point `articlePdfUrl` at the full article. The shipped PDFs live in
   `public/pdfs/<slug>.pdf` and are printed from the app's own `/print/<slug>`
   route by `npm run gen:pdfs`. An externally hosted article can use its
   absolute `https://` URL instead — either way share messages absolutise the
   link. `null` renders the "PDF unavailable" state.
4. Point `articleDocxUrl` at the editable Word version. These live in
   `public/docs/<slug>.docx` and are laid out from the same article data by
   [`scripts/generate-docx.mjs`](scripts/generate-docx.mjs) (`npm run gen:docx`),
   which needs no server. `null` simply hides the DOCX link.
5. `IS_DEMO_CONTENT` is already `false`; set it back to `true` only if the feed
   is ever repopulated with sample text, which re-shows the "sample content"
   disclosures in the header, intro strip and footer.

[`scripts/verify-browser.mjs`](scripts/verify-browser.mjs) asserts against the
article list — its `fixtures` block near the top (article count, a
single-article district, deep-link slugs) has to be kept in step.

Filters, facets, search and the share message all derive themselves from
whatever that file exports — no other change is needed.

Interface copy lives in one place too: **[`src/lib/copy.ts`](src/lib/copy.ts)**.
A Marathi reviewer only needs to read that file to review the whole interface.

---

## What is here

**Reading**
- Compact sticky masthead, short editorial intro, then search — no oversized hero.
- Featured lead story with a two-column editorial spread from `md` up.
- Responsive feed: single intentional column on phones, 2–3 columns on wider screens.
- Article opens in a dialog (full-screen sheet on phones, editorial dialog on
  desktop) rather than a separate route — there is not enough content per
  article to justify one.
- Poster fullscreen viewer with save and share actions where the browser
  supports them.

**Search** — [`src/lib/search.ts`](src/lib/search.ts)
- Two layers kept deliberately separate: normalized exact matching does the
  ranking and the highlighting; Fuse.js supplies typo tolerance only, capped so
  a fuzzy hit can never outrank a literal one.
- Multi-word queries are AND-ed, which is what keeps irrelevant results out.
- Unicode-safe: NFC composition, zero-width joiners stripped, Devanagari danda
  folded, case-insensitive for Latin.
- Weighted title ▸ district ▸ category/tags ▸ source ▸ author ▸ summary.
- Highlighting maps matches back onto the original Marathi string, so conjuncts
  and matras are never rewritten.

**Filters** — [`src/lib/filters.ts`](src/lib/filters.ts)
- District, category, source, tags, featured, and a date range.
- OR within a facet, AND across facets.
- Quick district rail always visible; everything else in a bottom sheet.
- Active-filter count, removable chips, clear-all, live result count.

**Share mode** — [`src/lib/share-message.ts`](src/lib/share-message.ts)
- Turns every card into a large selection target, so a tap meant to select can
  never open an article by accident.
- Selections survive searching and filtering until explicitly cleared.
- Sticky action bar with the count, select-all-visible and clear.
- Preview sheet shows the exact message before sending.
- Web Share API, WhatsApp prefill, and clipboard copy (with an `execCommand`
  fallback), each with Marathi success and failure feedback.
- Summaries are reproduced verbatim. If a message is too large for a WhatsApp
  prefill link, that is explained in Marathi rather than silently truncated, and
  Copy stays available.

**URL state** — [`src/lib/url-state.ts`](src/lib/url-state.ts)
- `?q=`, `?district=`, `?category=`, `?source=`, `?tag=`, `?featured=1`,
  `?from=`, `?to=`, `?sort=`, `?article=<slug>`.
- Written with the native History API, which the App Router keeps in sync with
  `useSearchParams()` — no server round-trip per keystroke.
- Opening an article pushes a history entry, so the browser's back gesture
  closes the dialog. Filters and search replace, so back does not step through
  every keystroke.
- Defaults are omitted, so a shared link to an untouched feed stays clean.

---

## Design

An original warm-paper editorial system, not derived from any existing site:
warm off-white surfaces, deep warm charcoal ink, restrained saffron and antique
gold accents, hairline rules, and controlled warm-tinted shadows. Tokens are all
in [`src/app/globals.css`](src/app/globals.css).

Typography pairs **Tiro Devanagari Marathi** (a serif drawn specifically for
Marathi) for headlines with **Noto Sans Devanagari** for body copy. Devanagari
gets no letter-spacing and no `uppercase` anywhere — both damage the script —
so hierarchy comes from size, weight and colour, with extra line-height so the
marks above the headline stroke are never clipped.

Motion is limited to orientation and feedback, and every animation honours
`prefers-reduced-motion`. The whole product is emoji-free; all icons are
[Lucide](https://lucide.dev) at consistent sizes and stroke widths, and every
icon-only control has an accessible name and a tooltip.

---

## Reused assets

Both copied from `mahasamvad-content-platform` and now vendored here, so this
project is self-contained. **No file in that project, or in
`maharashtra-is-building`, was modified.**

| File | Origin | Use |
| ---- | ------ | --- |
| `public/brand/maharashtra-seal.png` | `packages/poster-renderer/assets/emblem.png`, cropped to the seal, squared, background knocked out | Masthead mark, and the source for `src/app/icon.png` / `apple-icon.png` |
| `public/brand/maharashtra-emblem.png` | same file, unmodified | Kept as the untouched original |
| `public/brand/mahasamvad-logo.png` | `apps/web/public/mahasamvad-logo.png` | Source credit in the footer |

Nothing else was taken — no layout, components, colours, styling, information
architecture or visual direction.

---

## Verification

Run against the production build on `http://localhost:3111`:

```bash
npm run build
npx next start -p 3111
node scripts/verify-browser.mjs      # requires: npm i -D playwright && npx playwright install chromium
```

Last run:

- `npm run lint` — clean.
- `npm run typecheck` — clean.
- `npm run build` — clean, all routes static.
- `npm test` — **101 passing** across search, filters, share-message, date and
  url-state.
- `npm run dev` — renders with no hydration mismatch and no console errors.
- `scripts/verify-browser.mjs` — **49/49 checks passing** in Chromium: no
  horizontal overflow at 360/375/390/430/768/1440px, no touch target under
  ~44px at 360px, search + filter + sort combinations, refresh persistence,
  dialog deep-link / browser-back / Escape, poster fallback, missing-PDF state,
  multi-select share flow, generated message formatting, clipboard copy, and
  **no console errors**.

Screenshots from that run land in `.tmp-preview/shots/`.

---

## Known prototype limitations

- **No article links its full text yet.** Every article carries
  `articlePdfUrl: null`, so the dialog shows the "PDF unavailable" state and
  share messages say so. Paste the mahasamvad.in permalink (or a hosted PDF)
  into each article to light that path up.
- **The posters are typographic, not official artwork.** They are SVGs built by
  `npm run gen:posters` from each article's own kicker, headline and district.
  They carry no photography and do not reproduce an official release; replace
  them with the real posters when those are available.
- The graceful-degradation paths for a missing poster and a missing PDF are
  therefore only partly exercised: `scripts/verify-browser.mjs` skips the
  poster-fallback and PDF-present checks and reports them as skipped.
- **Single light theme.** The warm-paper look is a deliberate commitment;
  `color-scheme: light` is declared rather than shipping a half-considered dark
  mode.
- **No route per article.** Deep links work through `?article=<slug>`, but there
  are no per-article pages, so no per-article Open Graph metadata. Worth adding
  if articles ever need to preview when shared to social platforms.
- **Native share and poster save depend on the browser.** Both are feature
  detected; where unavailable, the interface says so in Marathi and offers
  WhatsApp and Copy instead.
- **The WhatsApp length ceilings are conservative estimates** (4,000 message
  characters / 30,000 encoded URL characters). WhatsApp publishes no hard limit
  for `wa.me` prefills; these were chosen so a normal multi-article share never
  warns, while a very large one does.
- **Browser verification covers Chromium only.** Safari and Firefox were not
  driven, so the iOS scroll-lock and Web Share paths are implemented to spec but
  unverified on real hardware.
