# Vice Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/BGBug22/gta6-cover-art-01-entry/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/BGBug22/gta6-cover-art-01-entry/reward.svg)](https://make.fun/c/gta6-cover-art-01)

**Vice Cover Studio** turns any photo and a caption into a multi-panel poster cover
in the style of a GTA 6 poster — drawn entirely in your browser, offline, with no
upload. Pick a photo, choose a layout and a colour grade, crop each panel, and
export a PNG ready to post.

## What it does

- **Any photo**: upload your own, drag it onto the preview, or start from one of
  the two bundled samples (Boulevard, Pier).
- **4 multi-panel layouts**: Hero (one big panel), Duo (two panels), Trio (three
  bands) and Grid (four panels). Click a panel on the cover to select it.
- **Per-panel crop**: every panel has its own photo source, zoom and position —
  one photo can fill all panels with a different crop in each, or each panel can
  use a different photo.
- **4 colour grades**: Sunset (magenta dusk), Neon (cyan nights), Noir (high
  contrast) and Palms (teal & gold). Each grade re-tints the photo, adds a
  sunset wash, a low sun, a skyline silhouette and a poster frame.
- **Editable caption**: a bold Anton title, a Pacifico script line and a tag line.
- **Exact export sizes**: 1080 × 1080, 1080 × 1350 and 1920 × 1080 PNG, one click
  (or press E). The preview always matches the size you will export.
- **Tip**: click any panel on the cover to select it, then use the Zoom and Move
  sliders to frame the best part of your photo inside that panel.

## Try it

Serve the `app/` folder with any static server and open `index.html`:

```sh
node serve.ts
# open http://localhost:8080
```

Everything runs offline: every script, font and image is a file under `app/`,
and photos are read on your own machine, never uploaded.

## Originality

No Rockstar Games logo, wordmark, artwork, character or font is used anywhere.
The display fonts are **Anton** and **Pacifico**, both under the SIL Open Font
License, shipped as files under `app/fonts/`. The sample photos were made with
an image model for this competition and are free to use.

## Files

- `app/index.html` — the editor page
- `app/style.css` — the dark Vice editor theme
- `app/src/cover.js` — the cover renderer (layouts, grades, title block, export)
- `app/src/main.js` — photo loading, controls, live preview, export
- `app/fonts/` — Anton & Pacifico (OFL)
- `app/samples/` — two sample photos
- `screenshots/` — the cover and the editor at work

License: MIT. Built for the [make.fun GTA 6 cover art bounty](https://make.fun/c/gta6-cover-art-01).
