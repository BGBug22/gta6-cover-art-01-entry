// Fixed scenes for screenshots, driven by the page's query string.
//   ?shot=cover&size=wide|square|portrait&photo=pier&title=PALM%20FEVER
//       hides the editor and paints one cover alone, at export size.
//   ?shot=editor&photo=boulevard&title=BOULEVARD%20QUEEN
//       shows the editor with a sample photo already loaded.
// Either way window.__shotReady is set once the cover is painted.
import { SIZES, drawCover } from './cover.js';

/** Waits until the bundled display fonts can be used by the canvas. */
export async function waitForFonts() {
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('100px Pacifico'),
      document.fonts.ready,
    ]);
  } catch (e) {
    // A font that fails to load falls back to the canvas default; the cover
    // still paints, so a screenshot is never blocked on fonts.
  }
}

/** Paints the cover once and flags the page ready for a screenshot. */
export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

export async function runShot(shot, query, setup) {
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const sizeName = query.get('size') || 'wide';
    const [w, h] = SIZES[sizeName] || SIZES.wide;
    const canvas = document.getElementById('cover');
    canvas.width = w;
    canvas.height = h;
    const art = setup.coverArt(query);
    await waitForFonts();
    drawCover(canvas, art, setup.photos());
    window.__coverSize = [w, h];
    markShotReady();
    return;
  }
  // Editor scene: load the sample, fill the caption, paint the preview.
  await setup.editorScene(query);
  await waitForFonts();
  setup.redraw();
  markShotReady();
}
