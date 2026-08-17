# Katxel — landing site

Static marketing site for Katxel and its three divisions. No build step, no
dependencies: the files in this repo *are* the site.

```
index.html      Umbrella homepage — "Three Lenses" hero that routes to a division
geo.html        Katxel Geo   — GIS, survey, data collection & processing
ops.html        Katxel Ops   — HRMS, project planning, internal tools
risk.html       Katxel Risk  — catastrophe & climate risk modelling

assets/
  site.css          Shared design system (all four pages)
  site.js           Shared behaviour: nav, dropdown, reveal, counters, contact form
  hero-lenses.js    Hero canvas — three-state on the homepage, single-state elsewhere
  favicon.svg       Browser tab icon

flood_ganges.gif        Ganges floodplain model output — shown on risk.html
hero_anim_preview.jpg   Social/OG preview image for risk.html
```

## Running it locally

Any static server works. From the repo root:

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>. Opening the files directly with `file://`
mostly works too, but a server is closer to production.

## The design system

Everything lives in `assets/site.css`. The one thing that changes per page is
the accent colour, set once on `<body>`:

```html
<body data-vertical="geo">   <!-- teal   #00C2A8 -->
<body data-vertical="ops">   <!-- indigo #6366F1 -->
<body data-vertical="risk">  <!-- orange #FF7A00 -->
```

Every component reads `var(--accent)` / `var(--accent-rgb)`, so buttons, icons,
eyebrows, chart strokes and focus rings all follow automatically. Don't
hard-code division colours in a component — set the variable instead.

On the homepage, `hero-lenses.js` rewrites `data-vertical` as the visitor moves
between the three lenses, which is what makes the whole page shift colour.

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
[Formspree](https://formspree.io) (or similar) and set the endpoint on all four
`<form class="form">` elements:

```html
<form class="form" data-endpoint="https://formspree.io/f/YOUR_ID" ...>
```

`site.js` then POSTs JSON and shows an inline success message. Every submission
carries a hidden `division` field (`Katxel`, `Katxel Geo`, `Katxel Ops`,
`Katxel Risk`) so a shared inbox can route by source.

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
- [ ] **Confirm the Geo and Ops copy.** Both pages were written from the
      service list, not from real project history. Check the specifics
      (accuracy figures, timelines, stack) match what you actually offer.
- [ ] **Analytics.** With three divisions you'll want to know which one draws
      traffic. Plausible or GA4, one snippet in each page's `<head>`.

## Deploying

Static hosting, nothing else required — GitHub Pages, Netlify, Cloudflare Pages
or any web host. Point `katxel.in` at it and update the `canonical` and `og:url`
tags if the domain ever changes.
