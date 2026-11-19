# Vice Cover Studio

![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/BGBug22/gta6-cover-art-01-entry/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/BGBug22/gta6-cover-art-01-entry/reward.svg)

A free offline web app that turns your photos and a caption into GTA 6-style
cover art — the multi-panel poster look with bold lettering and a Vice City
sunset / neon colour grade — exported as a PNG to share.

Built for the [gta6-cover-art-01 bounty](https://make.fun/c/gta6-cover-art-01)
on make.fun.

## How it works

1. **Add photos** — pick files from your machine, drag and drop them, or use
   the two sample photos. Photos never leave your machine; the app makes no
   network request at all.
2. **Pick a layout** — 7 poster layouts: Nine-Panel Grid, Hero + Three,
   Tilted Snapshots, Full-Bleed Hero, Split Sunset, Magazine Stack and
   Six-Panel Strip.
3. **Pick a colour grade** — 7 gradient-map grades (Vice Sunset, Neon Nights,
   Golden Hour, Palm Noir, Hot Pink, Teal Dawn, Chrome Dusk), each with
   vignette and film grain.
4. **Write your caption** — a big display title, a script subtitle, a badge
   ribbon, a five-star heat meter and an optional halftone dot title block.
5. **Crop each panel** — click a panel, drag to pan, zoom with the slider,
   flip it, or swap in another photo. Undo and redo are one key away.
6. **Export** — one click exports all three post sizes at once
   (1080 × 1080, 1080 × 1350, 1920 × 1080) as PNG files.

## Run it

Serve `app/` with any static file server and open `index.html` in desktop
Chrome. No build step, no network, no upload.

```sh
cd app && python3 -m http.server 8080
```

## Files

- `app/index.html` — the editor page
- `app/style.css` — editor styles
- `app/src/cover.js` — the cover engine: layouts, gradient-map grades,
  halftone title block, PNG export
- `app/src/main.js` — the editor: photos, panel picking and dragging,
  undo/redo, query scenes, export
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License
- `app/samples/` — two sample photos, free to use
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json`

## Originality

Everything here is original: the layout, the lettering (Anton and Pacifico,
both SIL OFL) and the code. No Rockstar Games logo, wordmark, official
artwork, character or font is used anywhere.

## License

MIT — see [LICENSE](LICENSE).
