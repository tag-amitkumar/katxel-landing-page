# Katxel — landing site

Static marketing site for Katxel and its four divisions. No build step: the
files in this repo *are* the site, plus two small email functions in `api/`.

```
index.html      Homepage — "Four Doors" division selector plus the story below it
geo.html        Katxel Geo   — GIS, survey, data collection & processing
ops.html        Katxel Ops   — HRMS, project planning, internal tools
risk.html       Katxel Risk  — catastrophe & climate risk modelling
learn.html      Katxel Learn — IT & GIS training, internships & placement
vercel.json     Clean-URL config (see Deploying)

ads/            Print-ready adverts (A4 flyer source + PDF) — see ads/README.md

students/       Student testimonials shown on /learn — see students/README.md
  testimonials.csv   one row per student
  images/            one image per student

assets/
  site.css          Shared design system (all five pages)
  site.js           Shared behaviour: nav, dropdown, reveal, counters, contact form
  internship.js     learn.html only: the internship application form

api/              Vercel functions that email form submissions (see Forms and email)
  apply.js          internship application  -> mailbox + candidate acknowledgement
  contact.js        enquiry form            -> mailbox + sender acknowledgement
  _lib/mail.js      shared SMTP / template helpers (not a function itself)
package.json      the one dependency of api/ (nodemailer); Vercel installs it
  home.css          Homepage-only: the doors, through-line, marquee, dark contact
  home.js           Homepage-only: door canvas, scroll-scrubbed diagram, counters
  hero-lenses.js    Division-page hero canvas (one locked state per division)
  favicon.svg       Browser tab icon
  cards/            One illustration per service/track card — see below

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

The homepage sets `data-vertical="geo"` only so shared components have an
accent to fall back on; its four door panels each carry their own `--c` inline,
which is why all four colours can sit on screen at once. `hero-lenses.js` is no
longer loaded there — it now serves the division-page heroes only.

### Card illustrations

Every service and track card carries a full-bleed banner from `assets/cards/`.
The artwork is deliberately colour-agnostic — white line art on a transparent
field — and the division accent comes from the gradient behind it, so the same
file works on any page (`remote-sensing.svg` and `drone.svg` are each used on
two). To swap one for a photograph, just point the `<img src>` at your image;
it is object-fit cover at 560x240, so a wide crop works best.

### Adding a page

Copy the closest existing division page, then change: `<title>`, the meta
description, `<link rel="canonical">`, the OG tags, `data-vertical`, the nav
`aria-current`, and the hidden `division` field in the contact form. Nav and
footer markup are duplicated across pages on purpose — it keeps the site
buildless and keeps every link crawlable.

## Forms and email (Hostinger mailbox)

Both forms send email through the Katxel mailbox on **Hostinger**, using two
small Vercel functions in `api/` (Node, `nodemailer` over SMTP):

| Form | Function | Your mailbox receives | The sender receives |
|---|---|---|---|
| Internship application, `learn.html#apply-internship` | `api/apply.js` | every field in a table, an application ID (`KL-…`), and a one-row CSV attachment for your register | an acknowledgement with the ID and a copy of their details |
| Enquiry form at the bottom of every page | `api/contact.js` | the same format: every field, an enquiry ID (`KQ-…`), and a one-row CSV attachment | an acknowledgement with the ID and a copy of their message |

Keep any new form in this format (reference ID, details table, CSV row,
Reply-To = sender) using the helpers in `api/_lib/mail.js`.

Mail is sent **from** your mailbox, so it shows in its Sent folder, and every
alert has **Reply-To set to the candidate**: press Reply and you are
answering them. The candidate's acknowledgement has Reply-To set to your
mailbox, so their replies land with you too.

If the function can't send (for example before the settings below exist), the
browser falls back to opening the visitor's mail client with everything
pre-filled, addressed to the form's `data-mailto`, so nothing is lost.

### Setup (one time)

1. **Vercel → katxel-landing-page → Settings → Environment Variables**, for
   *Production* (and *Preview* if you want to test on preview links):

   | Name | Value |
   |---|---|
   | `SMTP_USER` | your full Hostinger mailbox address, e.g. `info@katxel.in` |
   | `SMTP_PASS` | that mailbox's password (mark it *Sensitive*) |
   | `NOTIFY_EMAIL` | optional — where alerts go if not `SMTP_USER`; comma-separate several |

   Hostinger's SMTP server (`smtp.hostinger.com`, port 465, SSL) is the
   default; override with `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` only if
   Hostinger tells you otherwise.
2. **Deployments → ⋯ → Redeploy** so the functions pick the variables up.
3. **Turn on DKIM so the acknowledgements don't land in spam.** katxel.in
   already has Hostinger's SPF record but no DKIM key. In Hostinger hPanel →
   Emails → katxel.in → *DNS / email authentication*, copy the DKIM records
   it lists and add them in **Cloudflare → katxel.in → DNS** (type as shown,
   proxy status *DNS only*). Leave the existing MX and SPF records alone.
4. Send yourself a test from katxel.in/learn — you should get the alert and,
   at the address you entered, the acknowledgement.

To also feed the offer-letter generator's Applications inbox once
training.katxel.in is live, add `TRAINING_APPLY_URL` =
`https://training.katxel.in/api/apply` and `INTAKE_TOKEN` = a long random
string (the same value as `INTAKE_TOKEN` on the Cloudflare project).

### Spam protection

Both functions ignore forms submitted within 3 seconds of the page opening,
and limit each IP address (5 applications / 8 enquiries per hour on a warm
instance). If spam gets through, add Cloudflare Turnstile to the forms.

### Running the functions locally

`npm install`, then `npx vercel dev` with the variables in a git-ignored
`.env.local`. A plain static server serves the pages but not `api/`, so the
forms fall back to the pre-filled email there.

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

**Cloudflare overrides this.** katxel.in is proxied through Cloudflare,
whose *Browser Cache TTL* rewrites the header to `max-age=14400` (4 hours).
So when you change a shared asset, bump its `?v=` query on the pages that
need the new version (every page links its `assets/` files with
`?v=YYYY-MM-DD`). Alternatively set Cloudflare →
Caching → Configuration → Browser Cache TTL to *Respect Existing Headers*.

If you ever add content hashing to filenames, flip this back to a long
`max-age` — revalidating a hashed filename is wasted work.

Moving to a host without this feature (GitHub Pages, plain Apache) means
either restoring the `.html` links or configuring equivalent rewrites.
