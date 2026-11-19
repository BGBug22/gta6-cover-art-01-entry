// Vice Cover Studio — editor UI.
// Wires the toolbar, the photo tray, panel picking / dragging, undo-redo,
// query-param scenes and PNG export to the cover engine in cover.js.

import {
  GRADES, LAYOUTS, EXPORT_SIZES, COVER_TITLE, COVER_SUBTITLE, COVER_BADGE,
  defaultState, layoutById, gradeById, renderCover, exportCoverPng,
} from './cover.js';

const SAMPLES = [
  { name: 'boulevard', src: 'samples/boulevard.jpg' },
  { name: 'pier', src: 'samples/pier.jpg' },
];

const PREVIEW_SIZE = 1080;
const MAX_PHOTOS = 12;

const state = defaultState();
let selectedPanel = 0;
let undoStack = [];
let redoStack = [];
let previewDirty = true;
let renderQueued = false;

const $ = (id) => document.getElementById(id);
const canvas = $('coverCanvas');
const shotCanvas = $('shotCanvas');
const statusLine = $('statusLine');

// ---------------------------------------------------------------- photos

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function addPhoto(name, src) {
  if (state.photos.length >= MAX_PHOTOS) {
    setStatus(`Photo tray is full (${MAX_PHOTOS} photos).`);
    return null;
  }
  try {
    const img = await loadImage(src);
    const photo = { name, src, img };
    state.photos.push(photo);
    return photo;
  } catch (err) {
    setStatus(`Could not load photo “${name}”.`);
    return null;
  }
}

async function loadSample(name) {
  const sample = SAMPLES.find((s) => s.name === name);
  if (!sample) return null;
  if (state.photos.some((p) => p.src === sample.src)) return null;
  return addPhoto(sample.name, sample.src);
}

async function loadSamples() {
  await loadSample('boulevard');
  await loadSample('pier');
  // Panels default to alternating photos; keep that once both are in.
  state.panels.forEach((p, i) => { p.photo = i % state.photos.length; });
  refreshPhotoTray();
  refreshPanelPhotoSelect();
  requestPreview();
}

function handleFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (images.length === 0) {
    setStatus('Drop an image file to add it as a photo.');
    return;
  }
  (async () => {
    pushHistory();
    for (const file of images) {
      const url = URL.createObjectURL(file);
      await addPhoto(file.name.replace(/\.[^.]+$/, ''), url);
    }
    refreshPhotoTray();
    refreshPanelPhotoSelect();
    requestPreview();
    setStatus(`${images.length} photo${images.length > 1 ? 's' : ''} added. Pick a panel, then drag to crop.`);
  })();
}

// ---------------------------------------------------------------- history

function snapshotState() {
  return JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    subtitle: state.subtitle,
    badge: state.badge,
    heat: state.heat,
    halftone: state.halftone,
    panels: state.panels,
    photoNames: state.photos.map((p) => p.name),
    photoSrcs: state.photos.map((p) => p.src),
  });
}

function restoreSnapshot(json) {
  const snap = JSON.parse(json);
  state.layout = snap.layout;
  state.grade = snap.grade;
  state.title = snap.title;
  state.subtitle = snap.subtitle;
  state.badge = snap.badge;
  state.heat = snap.heat;
  state.halftone = snap.halftone;
  state.panels = snap.panels;
  // Photos stay as loaded (same srcs); only their order/names are restored.
  syncCaptionInputs();
  refreshLayoutTray();
  refreshGradeTray();
  refreshPanelTool();
  requestPreview();
}

function pushHistory() {
  undoStack.push(snapshotState());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(snapshotState());
  restoreSnapshot(undoStack.pop());
  updateUndoButtons();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(snapshotState());
  restoreSnapshot(redoStack.pop());
  updateUndoButtons();
}

function updateUndoButtons() {
  $('undoBtn').disabled = undoStack.length === 0;
  $('redoBtn').disabled = redoStack.length === 0;
}

// ---------------------------------------------------------------- preview

function setStatus(text) {
  statusLine.textContent = text;
}

function requestPreview() {
  previewDirty = true;
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    if (!previewDirty) return;
    previewDirty = false;
    renderCover(canvas, state, PREVIEW_SIZE, PREVIEW_SIZE);
    document.documentElement.dataset.ready = '1';
  });
}

// ---------------------------------------------------------------- trays

function refreshPhotoTray() {
  const tray = $('photoTray');
  tray.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.title = photo.name;
    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = photo.src;
    img.alt = photo.name;
    btn.appendChild(img);
    btn.addEventListener('click', () => {
      pushHistory();
      state.panels[selectedPanel].photo = i;
      refreshPanelPhotoSelect();
      requestPreview();
      setStatus(`Panel ${selectedPanel + 1} now shows “${photo.name}”.`);
    });
    tray.appendChild(btn);
  });
}

function gradeSwatchStyle(grade) {
  const stops = grade.stops;
  const mid = stops[Math.floor(stops.length / 2)];
  const last = stops[stops.length - 1];
  const first = stops[0];
  return `linear-gradient(135deg, rgb(${first.join(',')}), rgb(${mid.join(',')}) 55%, rgb(${last.join(',')}))`;
}

function refreshGradeTray() {
  const tray = $('gradeTray');
  tray.innerHTML = '';
  for (const grade of GRADES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `swatch${grade.id === state.grade ? ' selected' : ''}`;
    btn.title = grade.name;
    btn.textContent = grade.name;
    btn.style.background = gradeSwatchStyle(grade);
    btn.addEventListener('click', () => {
      pushHistory();
      state.grade = grade.id;
      refreshGradeTray();
      requestPreview();
      setStatus(`Grade: ${grade.name}.`);
    });
    tray.appendChild(btn);
  }
}

function refreshLayoutTray() {
  const tray = $('layoutTray');
  tray.innerHTML = '';
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = layout.name;
    if (layout.id === state.layout) btn.classList.add('active');
    btn.addEventListener('click', () => {
      pushHistory();
      state.layout = layout.id;
      selectedPanel = Math.min(selectedPanel, layout.panels - 1);
      refreshLayoutTray();
      refreshPanelTool();
      requestPreview();
      setStatus(`Layout: ${layout.name} (${layout.panels} panels).`);
    });
    tray.appendChild(btn);
  }
}

// ---------------------------------------------------------------- caption + panel tools

function syncCaptionInputs() {
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('badgeInput').value = state.badge;
  $('heatSelect').value = String(state.heat);
  $('halftoneToggle').checked = state.halftone;
}

function refreshPanelPhotoSelect() {
  const select = $('panelPhotoSelect');
  select.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = photo.name;
    select.appendChild(opt);
  });
  const panel = state.panels[selectedPanel];
  if (panel) select.value = String(panel.photo);
}

function refreshPanelTool() {
  const layout = layoutById(state.layout);
  $('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${layout.panels}`;
  const panel = state.panels[selectedPanel];
  $('zoomSlider').value = String(Math.round(panel.zoom * 100));
  $('zoomValue').textContent = `${Math.round(panel.zoom * 100)}%`;
  refreshPanelPhotoSelect();
}

// ---------------------------------------------------------------- panel picking + dragging

function panelAtPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (PREVIEW_SIZE / rect.width);
  const y = (clientY - rect.top) * (PREVIEW_SIZE / rect.height);
  const geo = layoutById(state.layout).rects(PREVIEW_SIZE, PREVIEW_SIZE);
  for (let i = geo.panels.length - 1; i >= 0; i--) {
    const p = geo.panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

let drag = null;

canvas.addEventListener('pointerdown', (event) => {
  const idx = panelAtPoint(event.clientX, event.clientY);
  if (idx < 0) return;
  selectedPanel = idx;
  refreshPanelTool();
  const rect = canvas.getBoundingClientRect();
  const geo = layoutById(state.layout).rects(PREVIEW_SIZE, PREVIEW_SIZE);
  const panel = state.panels[idx];
  const photo = state.photos[panel.photo];
  let overflowX = 1;
  let overflowY = 1;
  if (photo && photo.img && photo.img.naturalWidth > 0) {
    const g = geo.panels[idx];
    const base = Math.max(g.w / photo.img.naturalWidth, g.h / photo.img.naturalHeight);
    const scale = base * panel.zoom;
    overflowX = Math.max(1, photo.img.naturalWidth * scale - g.w);
    overflowY = Math.max(1, photo.img.naturalHeight * scale - g.h);
  }
  drag = {
    panel,
    geo: geo.panels[idx],
    startX: event.clientX,
    startY: event.clientY,
    panX: panel.panX,
    panY: panel.panY,
    overflowX,
    overflowY,
    scaleX: PREVIEW_SIZE / rect.width,
  };
  canvas.classList.add('dragging');
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const dx = (event.clientX - drag.startX) * drag.scaleX;
  const dy = (event.clientY - drag.startY) * drag.scaleX;
  if (!drag.pushed && Math.abs(dx) + Math.abs(dy) > 2) {
    // Snapshot the pre-drag state once, before the first real move.
    pushHistory();
    drag.pushed = true;
  }
  drag.panel.panX = Math.max(-1, Math.min(1, drag.panX + dx / (drag.overflowX / 2)));
  drag.panel.panY = Math.max(-1, Math.min(1, drag.panY + dy / (drag.overflowY / 2)));
  requestPreview();
});

canvas.addEventListener('pointerup', () => {
  if (!drag) return;
  drag = null;
  canvas.classList.remove('dragging');
});

// ---------------------------------------------------------------- export

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function safeFileName(text) {
  return (text || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cover';
}

async function exportOne(size) {
  setStatus(`Exporting ${size.label}…`);
  try {
    const blob = await exportCoverPng(state, size.w, size.h);
    downloadBlob(blob, `${safeFileName(state.title)}-${size.w}x${size.h}.png`);
    setStatus(`Exported ${size.label} (${Math.round(blob.size / 1024)} KiB).`);
  } catch (err) {
    setStatus('Export failed — try again.');
  }
}

async function exportAll() {
  for (const size of EXPORT_SIZES) {
    // eslint-disable-next-line no-await-in-loop
    await exportOne(size);
  }
  setStatus('All 3 sizes exported. Share your cover!');
}

// ---------------------------------------------------------------- query scenes

function readQuery() {
  return new URLSearchParams(window.location.search);
}

function applyQuery(params) {
  const layout = params.get('layout');
  if (layout && LAYOUTS.some((l) => l.id === layout)) state.layout = layout;
  const grade = params.get('grade');
  if (grade && GRADES.some((g) => g.id === grade)) state.grade = grade;
  const title = params.get('caption') || params.get('title');
  if (title) state.title = title.slice(0, 24);
  const subtitle = params.get('subtitle');
  if (subtitle) state.subtitle = subtitle.slice(0, 40);
  const heat = Number.parseInt(params.get('heat') || '', 10);
  if (heat >= 1 && heat <= 5) state.heat = heat;
  if (params.get('halftone') === '0') state.halftone = false;
  const photo = params.get('photo');
  if (photo) {
    // Put the named sample photo first in every panel.
    const idx = state.photos.findIndex((p) => p.name === photo);
    if (idx >= 0) state.panels.forEach((p) => { p.photo = idx; });
  }
  syncCaptionInputs();
  refreshLayoutTray();
  refreshGradeTray();
  refreshPanelTool();
}

function shotSize(params) {
  const size = params.get('size') || '';
  const match = /^(\d+)x(\d+)$/.exec(size);
  if (!match) return null;
  const w = Number.parseInt(match[1], 10);
  const h = Number.parseInt(match[2], 10);
  if (w < 100 || h < 100 || w > 4000 || h > 4000) return null;
  return { w, h };
}

async function renderShotScene(params) {
  document.body.classList.add('shot-cover');
  const size = shotSize(params) || { w: window.innerWidth, h: window.innerHeight };
  renderCover(shotCanvas, state, size.w, size.h);
  shotCanvas.style.width = `${size.w}px`;
  shotCanvas.style.height = `${size.h}px`;
  document.documentElement.dataset.ready = '1';
}

// ---------------------------------------------------------------- wiring

function wireEditor() {
  $('photoInput').addEventListener('change', (event) => {
    handleFiles(event.target.files);
    event.target.value = '';
  });
  $('sampleBoulevard').addEventListener('click', async () => {
    pushHistory();
    await loadSample('boulevard');
    refreshPhotoTray();
    refreshPanelPhotoSelect();
    requestPreview();
  });
  $('samplePier').addEventListener('click', async () => {
    pushHistory();
    await loadSample('pier');
    refreshPhotoTray();
    refreshPanelPhotoSelect();
    requestPreview();
  });
  $('titleInput').addEventListener('focus', pushHistory);
  $('titleInput').addEventListener('input', (event) => {
    state.title = event.target.value;
    requestPreview();
  });
  $('subtitleInput').addEventListener('focus', pushHistory);
  $('subtitleInput').addEventListener('input', (event) => {
    state.subtitle = event.target.value;
    requestPreview();
  });
  $('badgeInput').addEventListener('focus', pushHistory);
  $('badgeInput').addEventListener('input', (event) => {
    state.badge = event.target.value;
    requestPreview();
  });
  $('heatSelect').addEventListener('change', (event) => {
    pushHistory();
    state.heat = Number.parseInt(event.target.value, 10);
    requestPreview();
  });
  $('halftoneToggle').addEventListener('change', (event) => {
    pushHistory();
    state.halftone = event.target.checked;
    requestPreview();
  });
  $('panelPhotoSelect').addEventListener('change', (event) => {
    pushHistory();
    state.panels[selectedPanel].photo = Number.parseInt(event.target.value, 10);
    requestPreview();
  });
  $('zoomSlider').addEventListener('focus', pushHistory);
  $('zoomSlider').addEventListener('input', (event) => {
    state.panels[selectedPanel].zoom = Number.parseInt(event.target.value, 10) / 100;
    $('zoomValue').textContent = `${event.target.value}%`;
    requestPreview();
  });
  $('flipBtn').addEventListener('click', () => {
    pushHistory();
    const panel = state.panels[selectedPanel];
    panel.flip = !panel.flip;
    requestPreview();
  });
  $('resetPanelBtn').addEventListener('click', () => {
    pushHistory();
    state.panels[selectedPanel] = { photo: selectedPanel % 2, zoom: 1, panX: 0, panY: 0.85, flip: false };
    refreshPanelTool();
    requestPreview();
  });
  $('exportAllBtn').addEventListener('click', exportAll);
  document.querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = EXPORT_SIZES.find((s) => s.id === btn.dataset.export);
      if (size) exportOne(size);
    });
  });
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
    } else if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
      event.preventDefault();
      redo();
    }
  });
  document.addEventListener('dragover', (event) => {
    event.preventDefault();
    document.body.classList.add('dragover');
  });
  document.addEventListener('dragleave', (event) => {
    if (event.target === document.body) document.body.classList.remove('dragover');
  });
  document.addEventListener('drop', (event) => {
    event.preventDefault();
    document.body.classList.remove('dragover');
    if (event.dataTransfer) handleFiles(event.dataTransfer.files);
  });
  updateUndoButtons();
}

// ---------------------------------------------------------------- boot

async function boot() {
  try {
    await Promise.all([
      document.fonts.load('400 40px Anton'),
      document.fonts.load('400 40px Pacifico'),
    ]);
  } catch (err) {
    // Fonts fall back to system sans; the cover still renders.
  }
  const params = readQuery();
  await loadSamples();
  applyQuery(params);
  const shot = params.get('shot');
  if (shot === 'cover') {
    await renderShotScene(params);
  } else {
    wireEditor();
    refreshLayoutTray();
    refreshGradeTray();
    refreshPanelTool();
    syncCaptionInputs();
    pushHistory();
    requestPreview();
    setStatus('Ready — pick a layout and grade, edit your caption, export all 3 sizes.');
  }
  // Exposed for headless checks: the live state and a manual re-render.
  window.vice = { state, renderPreview: requestPreview, exportCoverPng };
}

boot().catch((err) => {
  setStatus(`Something went wrong while starting: ${err.message}`);
  document.documentElement.dataset.ready = 'error';
});
