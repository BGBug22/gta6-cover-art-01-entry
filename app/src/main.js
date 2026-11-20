// Vice Cover Studio — page wiring.
// Loads the sample photos, keeps the cover state, paints the live preview,
// lets the user drag each photo inside its panel, and exports the cover as a
// PNG in the three post sizes. A `?shot=` query paints a fixed scene instead
// (see shots.js) so screenshots are reproducible.
import { SIZES, LAYOUTS, PANEL_LABELS, layoutPanels, drawCover } from './cover.js';
import { runShot, waitForFonts } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const poolList = document.getElementById('pool');
const panelBox = document.getElementById('panel-editor');

/** The cover's state: every word on it, the layout, the grade, one entry per panel. */
const art = {
  title: 'PALM FEVER',
  subtitle: 'one last summer',
  tagline: 'FIVE FRIENDS · ONE COAST · NO WAY BACK',
  quote: 'PURE GOLDEN-HOUR MAYHEM',
  paper: 'THE HARBOR GAZETTE',
  volume: 'VOL. 1',
  credit: 'A SUNSET PICTURES PRODUCTION · STARRING YOU',
  layout: 'hero-center',
  grade: 'sunset',
  panels: [],
};

/** Loaded photos: { img, name }. Samples first, uploads appended after. */
const photos = [];
let exportSize = 'wide';
let selectedPanel = 2;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Fresh panel entries for a layout: photos cycle, crops vary per panel. */
export function defaultPanels(layout) {
  const count = (LAYOUTS[layout] ?? LAYOUTS['hero-center']).panels.length;
  const fx = [0.3, 0.5, 0.7, 0.5, 0.35, 0.65];
  const fy = [0.4, 0.55, 0.35, 0.6, 0.45, 0.5];
  const zoom = [1.15, 1.0, 1.25, 1.1, 1.0, 1.2];
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({ photo: i % Math.max(1, photos.length), zoom: zoom[i % 6], fx: fx[i % 6], fy: fy[i % 6], label: PANEL_LABELS[i] });
  }
  return out;
}

/** Repaints the preview canvas at a fast preview resolution. */
export function redraw() {
  const [w, h] = SIZES[exportSize];
  const scale = 960 / Math.max(w, h);
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  drawCover(canvas, art, photos.map((p) => p.img));
}

/** The photo pool, as small buttons; clicking one assigns it to the selected panel. */
export function renderPool() {
  poolList.innerHTML = '';
  photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pool-item';
    b.textContent = `${i + 1}. ${p.name}`;
    b.title = `Use this photo in panel ${selectedPanel + 1}`;
    b.addEventListener('click', () => {
      art.panels[selectedPanel].photo = i;
      renderPanelEditor();
      redraw();
    });
    poolList.appendChild(b);
  });
}

/** The selected panel's own controls: label, photo, zoom, focal point. */
export function renderPanelEditor() {
  const panel = art.panels[selectedPanel];
  if (!panel) return;
  panelBox.innerHTML = '';
  const head = document.createElement('h3');
  head.textContent = `Panel ${selectedPanel + 1} — ${panel.label}`;
  panelBox.appendChild(head);
  const mkRow = (labelText, control) => {
    const row = document.createElement('label');
    row.className = 'row';
    row.append(document.createTextNode(labelText), control);
    panelBox.appendChild(row);
    return control;
  };
  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.maxLength = 18;
  labelInput.value = panel.label;
  labelInput.addEventListener('input', () => { panel.label = labelInput.value; redraw(); });
  mkRow('Label', labelInput);
  const photoSel = document.createElement('select');
  photos.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = `${i + 1}. ${p.name}`;
    photoSel.appendChild(o);
  });
  photoSel.value = String(panel.photo ?? 0);
  photoSel.addEventListener('change', () => { panel.photo = Number(photoSel.value); redraw(); });
  mkRow('Photo', photoSel);
  const zoom = document.createElement('input');
  zoom.type = 'range'; zoom.min = '1'; zoom.max = '2'; zoom.step = '0.05'; zoom.value = String(panel.zoom);
  zoom.addEventListener('input', () => { panel.zoom = Number(zoom.value); redraw(); });
  mkRow('Zoom', zoom);
  const fx = document.createElement('input');
  fx.type = 'range'; fx.min = '0'; fx.max = '1'; fx.step = '0.05'; fx.value = String(panel.fx);
  fx.addEventListener('input', () => { panel.fx = Number(fx.value); redraw(); });
  mkRow('Focus left–right', fx);
  const fy = document.createElement('input');
  fy.type = 'range'; fy.min = '0'; fy.max = '1'; fy.step = '0.05'; fy.value = String(panel.fy);
  fy.addEventListener('input', () => { panel.fy = Number(fy.value); redraw(); });
  mkRow('Focus top–bottom', fy);
}

/** Exports the cover at full size and downloads it as a PNG. */
export function exportCover(sizeName) {
  const [w, h] = SIZES[sizeName];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, art, photos.map((p) => p.img));
  off.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed: the canvas gave no PNG.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-cover-${w}x${h}.png`;
  }, 'image/png');
}

/** Binds one text input to one field of the cover state. */
function bindText(id, field) {
  const el = document.getElementById(id);
  el.addEventListener('input', () => { art[field] = el.value; redraw(); });
}

/** Binds a radio group (layout, grade, size) to the cover state. */
function bindRadios(name, apply) {
  document.querySelectorAll(`input[name="${name}"]`).forEach((radio) => {
    radio.addEventListener('change', () => { if (radio.checked) apply(radio.value); });
  });
}

/** Drags the photo inside the panel under the pointer; wheel zooms it. */
function bindCanvasDrag() {
  let drag = null;
  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  };
  const pickPanel = (pt) => {
    const rects = layoutPanels(art.layout, canvas.width, canvas.height);
    for (let i = rects.length - 1; i >= 0; i--) {
      const rc = rects[i];
      if (pt.x >= rc.x && pt.x <= rc.x + rc.w && pt.y >= rc.y && pt.y <= rc.y + rc.h) return i;
    }
    return -1;
  };
  canvas.addEventListener('pointerdown', (e) => {
    const pt = toCanvas(e);
    const i = pickPanel(pt);
    if (i < 0) return;
    selectedPanel = i;
    renderPanelEditor();
    const panel = art.panels[i];
    drag = { panel, x: pt.x, y: pt.y, fx: panel.fx, fy: panel.fy };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const pt = toCanvas(e);
    const rects = layoutPanels(art.layout, canvas.width, canvas.height);
    const rc = rects[selectedPanel];
    drag.panel.fx = Math.min(1, Math.max(0, drag.fx - (pt.x - drag.x) / rc.w));
    drag.panel.fy = Math.min(1, Math.max(0, drag.fy - (pt.y - drag.y) / rc.h));
    redraw();
    renderPanelEditor();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    const pt = toCanvas(e);
    const i = pickPanel(pt);
    if (i < 0) return;
    e.preventDefault();
    selectedPanel = i;
    const panel = art.panels[i];
    panel.zoom = Math.min(2, Math.max(1, panel.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
    renderPanelEditor();
    redraw();
  }, { passive: false });
}

/** Loads the two model-made sample photos shipped with the app. */
async function loadSamples() {
  const names = [['pier', 'Pier at dusk'], ['boulevard', 'Boulevard palms']];
  for (const [file, name] of names) {
    try {
      const img = await loadImage(`samples/${file}.jpg`);
      photos.push({ img, name });
    } catch (e) {
      status.textContent = `Could not load the sample photo ${file}.jpg.`;
    }
  }
}

bindText('title', 'title');
bindText('subtitle', 'subtitle');
bindText('tagline', 'tagline');
bindText('quote', 'quote');
bindText('paper', 'paper');
bindText('volume', 'volume');
bindText('credit', 'credit');
bindRadios('layout', (v) => { art.layout = v; art.panels = defaultPanels(v); selectedPanel = Math.min(selectedPanel, art.panels.length - 1); renderPanelEditor(); redraw(); });
bindRadios('grade', (v) => { art.grade = v; redraw(); });
bindRadios('size', (v) => { exportSize = v; redraw(); });
document.querySelectorAll('[data-export]').forEach((b) => {
  b.addEventListener('click', () => exportCover(b.dataset.export));
});
document.getElementById('photo').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      photos.push({ img, name: file.name.replace(/\.[^.]+$/, '') });
    } catch (err) {
      status.textContent = `Could not read ${file.name} as a photo.`;
    }
  }
  renderPool();
  renderPanelEditor();
  redraw();
});
bindCanvasDrag();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
await loadSamples();
art.panels = defaultPanels(art.layout);
renderPool();
renderPanelEditor();
if (shot) {
  await runShot(shot, query, {
    coverArt: (q) => {
      const panels = defaultPanels(q.get('layout') || art.layout);
      // ?photo= picks which sample leads the collage; panels cycle from it.
      const pick = (q.get('photo') || '').toLowerCase();
      const start = photos.findIndex((p) => p.name.toLowerCase().startsWith(pick));
      if (start > 0) panels.forEach((p, i) => { p.photo = (start + i) % photos.length; });
      return {
        ...art,
        title: q.get('title') || art.title,
        subtitle: q.get('subtitle') ?? art.subtitle,
        tagline: q.get('tagline') ?? art.tagline,
        quote: q.get('quote') ?? art.quote,
        paper: q.get('paper') ?? art.paper,
        volume: q.get('volume') ?? art.volume,
        credit: q.get('credit') ?? art.credit,
        layout: q.get('layout') || art.layout,
        grade: q.get('grade') || art.grade,
        panels,
      };
    },
    photos: () => photos.map((p) => p.img),
    editorScene: async (q) => {
      const pick = q.get('photo') || 'pier';
      const hit = photos.findIndex((p) => p.name.toLowerCase().startsWith(pick));
      if (hit >= 0) {
        art.panels.forEach((p, i) => { p.photo = (hit + i) % photos.length; });
      }
      if (q.get('title')) { art.title = q.get('title'); document.getElementById('title').value = art.title; }
      if (q.get('layout')) { art.layout = q.get('layout'); art.panels = defaultPanels(art.layout); }
      if (q.get('grade')) { art.grade = q.get('grade'); }
    },
    redraw,
  });
} else {
  await waitForFonts();
  redraw();
  window.__shotReady = true;
}
