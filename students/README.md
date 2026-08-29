# Student testimonials

The Katxel Learn page reads this folder at runtime. To add a student you add
one image and one CSV row — nothing else, no code change, no rebuild.

```
students/
  testimonials.csv     one row per student
  images/              one image per student
```

## Adding a student

1. Drop their photo in `images/`. Square works best (it is displayed as a
   circle at 84px). JPG, PNG, WebP and SVG all work. Keep it under ~200 KB.
2. Add a row to `testimonials.csv`.
3. Commit and push. It is live on the next deploy.

## Columns

| Column | What goes in it |
|---|---|
| `id` | Anything unique — `S-006`, `S-007`. Used for your own tracking only. |
| `image` | Path relative to this folder, e.g. `images/student-06.jpg` |
| `name` | As it should appear on the site. A first name and initial is plenty. |
| `programme` | Which track they completed — must read naturally, it is shown as-is |
| `completed` | `YYYY-MM`. Shown as e.g. "May 2026". |
| `status` | `live` or `demo` — see below |
| `message` | Their words. **Wrap it in double quotes** — it will contain commas. |

To put a double quote *inside* a message, double it: `"she said ""yes"" to it"`.

## `status`, and why it matters

- **`live`** — shown on the site as a real testimonial.
- **`demo`** — a placeholder.

The page prefers `live` rows. If it finds any, it shows only those. If it finds
none, it falls back to the `demo` rows and labels the section as sample entries,
so the layout is never empty while you are still collecting real quotes.

**Every row in this file is currently `demo`.** The names, messages and images
are placeholders written to demonstrate the format — they are not real students.
Replace them with real quotes and set `status` to `live` before you promote the
page. Publishing invented student testimonials is worse than publishing none,
and for a training provider it is the kind of claim people check.

## Consent

Get written permission before publishing a student's name, photo or words, and
keep a record of it. A short message confirming they are happy for it to appear
on katxel.in is enough.
