# Adverts

Print-ready one-pagers built from the site content.

```
katxel-learn-flyer.html   the editable source — this is what you change
katxel-learn-a4.pdf       the rendered output, A4 portrait, single page
```

## Editing

Open the HTML, change the text, then re-render. Everything is sized in
millimetres against a real A4 page, so what you see in the browser is what
comes out of the printer.

**Re-rendering** — from this folder:

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 --print-to-pdf="katxel-learn-a4.pdf" "katxel-learn-flyer.html"
```

Or simply open the HTML in Chrome or Edge and use **Print → Save as PDF**, with
paper **A4**, margins **None**, and **Background graphics ON**. Without that last
option the navy header and footer print white.

## Notes on the content

- **No phone number.** It was removed from the site, so it is off the advert
  too. If you want a number on printed material, add it to the `.reach` block
  in the footer — that is the only place it needs to go.
- **No placement rate.** The advert promises placement *support* and says what
  the certificate contains. It deliberately claims no percentage, because an
  unbacked placement figure is the first thing a sceptical parent checks.
- The eight tracks, cohort length and project count mirror `/learn`. If you
  change them there, change them here — they are not linked.

## Sizes

A4 portrait, 210 × 297 mm. For A5 handouts, print two-up. For a social post,
export the PDF to PNG at 2x and crop to the header plus stats band — that
section is designed to stand alone.
