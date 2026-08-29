# Katxel — landing site

Static marketing site for Katxel and its four divisions. No build step, no
dependencies: the files in this repo *are* the site.

```
index.html      Homepage — "Four Doors" division selector plus the story below it
geo.html        Katxel Geo   — GIS, survey, data collection & processing
ops.html        Katxel Ops   — HRMS, project planning, internal tools
risk.html       Katxel Risk  — catastrophe & climate risk modelling
learn.html      Katxel Learn — IT & GIS training, internships & placement
vercel.json     Clean-URL config (see Deploying)

assets/
  site.css          Shared design system (all five pages)
  site.js           Shared behaviour: nav, dropdown, reveal, counters, contact form
  home.css          Homepage-only: the doors, through-line, marquee, dark contact
  home.js           Homepage-only: door canvas, scroll-scrubbed diagram, counters
  hero-lenses.js    Division-page hero canvas (one locked state per division)
  favicon.svg       Browser tab icon

flood_ganges.gif        Ganges floodplain model output — shown on risk.html
hero_anim_preview.jpg   Social/OG preview image for risk.html
```

## Running it locally

Use the Vercel CLI so local routing matches production:

```bash
npx vercel dev
```

A plain static server (`python -m http.server 8080`) also serves the site, but
it doesn't honour `cleanUrls`, so `/geo` will 404 there — you'd have to browse
`/geo.html` instead. Internal links point at the clean URLs, so `file://`
browsing no longer works.

## The design system

Everything lives in `assets/site.css`. The one thing that changes per page is
the accent colour, set once on `<body>`:

```html
<body data-vertical="geo">   <!-- teal   #00C2A8 -->
<body data-vertical="ops">   <!-- indigo #6366F1 -->
<body data-vertical="risk">  <!-- orange #FF7A00 -->
<body data-vertical="learn"> <!-- green  #22C55E -->
```

Every component reads `var(--accent)` / `var(--accent-rgb)`, so buttons, icons,
eyebrows, chart strokes and focus rings all follow automatically. Don't
hard-code division colours in a component — set the variable instead.

On the homepage, `hero-lenses.js` rewrites `data-vertical` as the visitor moves
between the four lenses, which is what makes the whole page shift colour.

### Adding a page

Copy the closest existing division page, then change: `<title>`, the meta
description, `<link rel="canonical">`, the OG tags, `data-vertical`, the nav
`aria-current`, and the hidden `division` field in the contact form. Nav and
footer markup are duplicated across pages on purpose — it keeps the site
buildless and keeps every link crawlable.

## Contact form

The form works with no backend. If `data-endpoint` is empty it opens the
visitor's mail client with every field pre-filled and addressed to
`data-mailto`. That is the current state — leads arrive as ordinary email.

To collect submissions properly instead, create a form on
[Formspree](https://formspree.io) (or similar) and set the endpoint on all five
`<form class="form">` elements:

```html
<form class="form" data-endpoint="https://formspree.io/f/YOUR_ID" ...>
```

`site.js` then POSTs JSON and shows an inline success message. Every submission
carries a hidden `division` field (`Katxel`, `Katxel Geo`, `Katxel Ops`,
`Katxel Risk`, `Katxel Learn`) so a shared inbox can route by source.

## Before this goes live

- [ ] **OG images for `index.html`, `geo.html`, `ops.html`.** Only `risk.html`
      has one. 1200×630 PNG or JPG, then add `og:image` + `twitter:image`.
- [ ] **Real social links.** The footer icons currently point at WhatsApp,
      email and phone. Swap in LinkedIn etc. once those accounts exist.
- [ ] **A business email domain.** The site says `katxel.in` but every address
      is `info.katxel@gmail.com`. For insurance and government buyers that
      mismatch costs credibility.
- [ ] **Verify the Risk case studies and testimonials.** The four case-study
      figures and three testimonials on `risk.html` carry no attribution. If
      they aren't backed by real engagements, cut them — anonymous claims are
      worse than a shorter page.
- [ ] **Confirm the Learn programme details.** Track names, the 8-week cohort
      length, module breakdowns and "3 live projects" were written as a
      structure to react to, not from a delivered syllabus. Fix them before
      anyone enrols. The page deliberately claims placement *support* and no
      placement *rate* — do not add one unless it is real and measured.
- [ ] **Confirm the Geo and Ops copy.** Both pages were written from the
      service list, not from real project history. Check the specifics
      (accuracy figures, timelines, stack) match what you actually offer.
- [ ] **Analytics.** With four divisions you'll want to know which one draws
      traffic. Plausible or GA4, one snippet in each page's `<head>`.

## Deploying

Deployed on Vercel as a static site — no build command, no output directory.
Point `katxel.in` at it and update the `canonical` and `og:url` tags if the
domain ever changes.

### Clean URLs

`vercel.json` sets `cleanUrls: true`, so pages are served without the `.html`
extension and every internal link uses the short form:

| File | URL |
|---|---|
| `index.html` | `/` |
| `geo.html` | `/geo` |
| `ops.html` | `/ops` |
| `risk.html` | `/risk` |
| `learn.html` | `/learn` |

Vercel also 308-redirects `/geo.html` → `/geo` automatically, so older links
and bookmarks keep working. `/home` and `/index` redirect to `/`.

Two things to keep in mind when editing:

- **`trailingSlash` must stay `false`.** Assets are referenced relatively
  (`assets/site.css`). At `/geo` that resolves to `/assets/site.css`; at
  `/geo/` it would resolve to `/geo/assets/site.css` and 404.
- **`index.html` keeps its name.** It is the document a web server returns for
  `/`, so renaming it to `home.html` would make the root URL 404 unless a
  rewrite is added. Nobody sees the filename anyway — the homepage URL is
  just `katxel.in`.

### Asset caching

Asset filenames are not content-hashed (`site.css`, not `site.a1b2c3.css`), so
Vercel's default four-hour cache meant a returning visitor kept the old
stylesheet after a deploy. `vercel.json` therefore serves `/assets/*` with
`max-age=0, must-revalidate`: the browser still caches the file but revalidates
every load, so a change goes live immediately and an unchanged file costs only
a 304.

If you ever add content hashing to filenames, flip this back to a long
`max-age` — revalidating a hashed filename is wasted work.

Moving to a host without this feature (GitHub Pages, plain Apache) means
either restoring the `.html` links or configuring equivalent rewrites.
