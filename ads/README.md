# Adverts

Print-ready one-pagers built from the site content.

```
katxel-learn-flyer.html    minimal one-pager — source
katxel-learn-a4.pdf        minimal one-pager — rendered, A4, single page
katxel-learn-poster.html   full-detail poster — source
katxel-learn-poster-a4.pdf full-detail poster — rendered, A4, single page
qr-learn.svg               QR code for https://www.katxel.in/learn
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

## The QR code

`qr-learn.svg` encodes `https://www.katxel.in/learn`. It is a version-3,
error-correction-M code generated from scratch and checked three ways: the
Reed-Solomon syndromes are all zero, the format bits match the published
standard table for all eight masks, and the finished matrix reads back to the
exact URL. **Scan it once with your own phone before a print run** — the checks
prove the encoding is correct, they do not prove your printer reproduced it.

If the URL ever changes the whole code changes; it cannot be edited by hand.

## Fitting the poster on one page

The poster is dense and sits within about 1mm of the bottom of the sheet. If
you add a bullet or lengthen a heading it will silently push to a second page.
After any edit, open it in the browser at A4 and check the footer still lands
on the first sheet before re-rendering.

## Sizes

A4 portrait, 210 × 297 mm. For A5 handouts, print two-up. For a social post,
export the PDF to PNG at 2x and crop to the header plus stats band — that
section is designed to stand alone.
