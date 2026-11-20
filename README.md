# Vice Cover Studio — GTA 6-style cover art maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/BGBug22/gta6-cover-art-01-entry/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/BGBug22/gta6-cover-art-01-entry/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Entry for the [gta6-cover-art-01 bounty on make.fun](https://make.fun/c/gta6-cover-art-01): a web app that turns your photo and a caption into GTA 6-style cover art — a multi-panel sunset-coast poster with bold gradient lettering — exported as a PNG to share.

## What it does

- **Any photo** — upload your own photos (they never leave your machine) or use the two built-in samples. Fill 4–6 panels with one photo or several.
- **Crop and position each panel** — click a panel to select it, then drag its photo inside the panel, scroll to zoom, or use the zoom / focus sliders.
- **Four layouts** — Hero Center, Hero Left, Hero Right, Six Split — each with character labels on the panels (`THE DRIVER`, `THE BOSS`, …).
- **Four colour grades** — Sunset, Neon Nights, Golden Hour, Violet Dusk.
- **Poster lettering** — a huge gradient title with a dark outline and retro stripes, a script subtitle, a five-star press quote on top, a tagline ribbon, a gold `ORIGINAL COVER ART` seal, a barcode and a credit strip.
- **Fast and easy** — photo to PNG in a few taps, in all three post sizes: **1080×1080, 1080×1350, 1920×1080**.
- **Fully offline** — static files under `app/`, no build step, no network request. Fonts are bundled OFL files; the sample photos were made with an image model for this app.

## Try it

```sh
node serve.ts   # serves app/ at http://localhost:8080
```

Or open `app/index.html` from any static server. Pick a layout and a grade, type your title, drag the photos where you want them, and hit Export.

## How it is built

- `app/index.html` — the editor page (controls on the left, live preview on the right).
- `app/style.css` — the dark neon editor UI.
- `app/src/cover.js` — the cover renderer: panels, title, seal, barcode, palms (pure canvas 2D, deterministic — same state, same pixels).
- `app/src/main.js` — page wiring: photo pool, panel editor, drag-to-pan, exports.
- `app/src/shots.js` — fixed `?shot=` scenes so the screenshots are reproducible.
- `app/fonts/` — Anton + Pacifico under the SIL Open Font License (`OFL.txt`).
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library.

## Originality

100% original artwork and fictional names. No Rockstar Games logo, wordmark, official artwork, character or font is used anywhere. All names (titles, labels, papers, production credits) are invented for this app.

## Verification (local, Playwright + Chromium)

- 0 console errors, 0 page errors, 0 network requests (fully offline).
- Playtest: retitle, switch layout + grade + size, export all three sizes — PNGs are exactly 1920×1080, 1080×1080 and 1080×1350.
- Determinism: the same cover drawn twice is pixel-identical, and `main.ts` run 4× writes a byte-identical `dossier.json` (sha256 `a0d0f85b…`).
- Dossier: 958,121 bytes total (text capped at 163,840), 4 screenshots, each under 256 KiB.
- `makefun check`: 4 passed / 0 failed, 17 skipped (transcript checks run on the sealed recordings at submission); the 5 at-submission items need the commit pushed to the public GitHub repo first.

## Final visual patch (20 Nov 2026)

Five small fixes, no architecture change: (1) the title + subtitle + tagline block moved ~5% higher so the tagline pill clears the credit strip with a clean gap at all three export sizes; (2) panel crops now anchor to the top (fy ~0.16) with the focal x following the face (pier's fisherman left, boulevard's woman right), so heads and eyes are never cropped at the top or side; (3) a panel label that would sit on a face goes to the opposite top corner, and a bottom label that would slide under the tagline ribbon moves to the top instead; (4) a mild poster-ink grade (`saturate(1.15) contrast(1.07)`, a slightly stronger grade tint, a faint vignette) unifies the blue-sky and sunset photos into one poster while skin tones stay natural; (5) this README updated in the same session.

## License

MIT — see [LICENSE](LICENSE).
