// Vice Cover Studio — editor wiring (fresh build).
// Loads photos, binds every control, renders the live preview and exports PNGs.
// All state lives here; all drawing lives in cover.js.

import {
  SIZES,
  LAYOUTS,
  GRADES,
  panelCount,
  freshPanels,
  renderCover,
  exportCoverDataURL,
} from "./cover.js";

const $ = (id) => document.getElementById(id);

const state = {
  title: "NEON COAST",
  subtitle: "a night in the city",
  tag: "SUMMER · 2026",
  layout: "duo",
  grade: "sunset",
  size: { label: "1080 × 1080", w: 1080, h: 1080 },
  panels: freshPanels("duo"),
  selectedPanel: 0,
};

// Images keyed by source name: main (uploaded or chosen sample), boulevard, pier.
const images = { main: null, boulevard: null, pier: null };
let activeSample = "pier";

const preview = $("preview");
let lastPanels = [];
let renderQueued = false;

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderPreview();
  });
}

function renderPreview() {
  const { w, h } = state.size;
  const pw = 720;
  const ph = Math.round((720 * h) / w);
  preview.width = pw;
  preview.height = ph;
  lastPanels = renderCover(preview, pw, ph, state, images);
  $("sizeLabel").textContent = state.size.label;
}

function setStatus(text) {
  $("statusLine").textContent = text;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load " + src));
    img.src = src;
  });
}

async function useSample(name) {
  activeSample = name;
  try {
    images.main = images[name] || (await loadImage(`samples/${name}.jpg`));
    images[name] = images.main;
    document.querySelectorAll(".thumb-btn").forEach((b) => b.classList.remove("active"));
    const btn = name === "boulevard" ? $("sampleBoulevard") : $("samplePier");
    btn.classList.add("active");
    setStatus(`Sample photo loaded: ${name}. Pick a layout, a grade, then export.`);
    queueRender();
  } catch (err) {
    setStatus("That sample could not be loaded. Try the other one or upload a photo.");
  }
}

function useUpload(file) {
  if (!file || !file.type.startsWith("image/")) {
    setStatus("Please choose an image file.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      images.main = img;
      activeSample = "upload";
      document.querySelectorAll(".thumb-btn").forEach((b) => b.classList.remove("active"));
      setStatus(`Your photo is in: ${file.name}. Crop any panel, then export.`);
      queueRender();
    };
    img.onerror = () => setStatus("That file could not be read as a photo.");
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

function rebuildPanelPicker() {
  const picker = $("panelPicker");
  picker.innerHTML = "";
  const n = panelCount(state.layout);
  for (let i = 0; i < n; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `Panel ${i + 1}`;
    if (i === state.selectedPanel) b.classList.add("active");
    b.addEventListener("click", () => {
      state.selectedPanel = i;
      syncCropControls();
      rebuildPanelPicker();
      queueRender();
    });
    picker.appendChild(b);
  }
}

function syncCropControls() {
  const crop = state.panels[state.selectedPanel] || { src: "main", zoom: 1.15, ox: 0, oy: 0 };
  $("panelSource").value = crop.src;
  $("zoomRange").value = String(crop.zoom);
  $("oxRange").value = String(crop.ox);
  $("oyRange").value = String(crop.oy);
}

function bindGroup(containerId, attr, onPick) {
  const box = $(containerId);
  box.addEventListener("click", (ev) => {
    const btn = ev.target.closest(`[data-${attr}]`);
    if (!btn) return;
    box.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    onPick(btn.dataset[attr]);
  });
}

function resizePanels(oldPanels, layout) {
  const fresh = freshPanels(layout);
  return fresh.map((d, i) => oldPanels[i] || d);
}

function applyQuery() {
  const q = new URLSearchParams(location.search);
  const photo = q.get("photo");
  const layout = q.get("layout");
  const grade = q.get("grade");
  const size = q.get("size");
  if (layout && LAYOUTS[layout]) {
    state.layout = layout;
    state.panels = freshPanels(layout);
    document.querySelectorAll("#layoutBtns button").forEach((b) =>
      b.classList.toggle("active", b.dataset.layout === layout),
    );
  }
  if (grade && GRADES[grade]) {
    state.grade = grade;
    document.querySelectorAll("#gradeBtns button").forEach((b) =>
      b.classList.toggle("active", b.dataset.grade === grade),
    );
  }
  if (size) {
    const found = SIZES.find((s) => `${s.w}x${s.h}` === size);
    if (found) {
      state.size = found;
      document.querySelectorAll("#sizeBtns button").forEach((b) =>
        b.classList.toggle("active", b.dataset.size === size),
      );
    }
  }
  if (q.get("title")) { state.title = q.get("title"); $("titleInput").value = state.title; }
  if (q.get("subtitle")) { state.subtitle = q.get("subtitle"); $("subtitleInput").value = state.subtitle; }
  if (q.get("tag")) { state.tag = q.get("tag"); $("tagInput").value = state.tag; }
  return photo || "pier";
}

function exportNow() {
  const { w, h } = state.size;
  const url = exportCoverDataURL(w, h, state, images);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vice-cover-${w}x${h}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setStatus(`Exported ${w} × ${h} PNG. Check your downloads.`);
}

// ---- wire up ----

$("fileInput").addEventListener("change", (ev) => useUpload(ev.target.files[0]));
$("sampleBoulevard").addEventListener("click", () => useSample("boulevard"));
$("samplePier").addEventListener("click", () => useSample("pier"));

$("titleInput").addEventListener("input", (ev) => { state.title = ev.target.value; queueRender(); });
$("subtitleInput").addEventListener("input", (ev) => { state.subtitle = ev.target.value; queueRender(); });
$("tagInput").addEventListener("input", (ev) => { state.tag = ev.target.value; queueRender(); });

bindGroup("layoutBtns", "layout", (layout) => {
  state.layout = layout;
  state.panels = resizePanels(state.panels, layout);
  state.selectedPanel = 0;
  rebuildPanelPicker();
  syncCropControls();
  queueRender();
});
bindGroup("gradeBtns", "grade", (grade) => { state.grade = grade; queueRender(); });
bindGroup("sizeBtns", "size", (size) => {
  const found = SIZES.find((s) => `${s.w}x${s.h}` === size);
  if (found) { state.size = found; queueRender(); }
});

$("panelSource").addEventListener("change", (ev) => {
  state.panels[state.selectedPanel].src = ev.target.value;
  queueRender();
});
$("zoomRange").addEventListener("input", (ev) => {
  state.panels[state.selectedPanel].zoom = Number(ev.target.value);
  queueRender();
});
$("oxRange").addEventListener("input", (ev) => {
  state.panels[state.selectedPanel].ox = Number(ev.target.value);
  queueRender();
});
$("oyRange").addEventListener("input", (ev) => {
  state.panels[state.selectedPanel].oy = Number(ev.target.value);
  queueRender();
});
$("resetCropBtn").addEventListener("click", () => {
  const fresh = freshPanels(state.layout)[state.selectedPanel];
  state.panels[state.selectedPanel] = { ...fresh };
  syncCropControls();
  queueRender();
});

preview.addEventListener("click", (ev) => {
  const rect = preview.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * preview.width;
  const y = ((ev.clientY - rect.top) / rect.height) * preview.height;
  const hit = lastPanels.findIndex((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
  if (hit >= 0) {
    state.selectedPanel = hit;
    syncCropControls();
    rebuildPanelPicker();
    setStatus(`Panel ${hit + 1} selected — crop it with the sliders.`);
  }
});

preview.addEventListener("dragover", (ev) => ev.preventDefault());
preview.addEventListener("drop", (ev) => {
  ev.preventDefault();
  useUpload(ev.dataTransfer.files[0]);
});

$("exportBtn").addEventListener("click", exportNow);

// Keyboard shortcut: press E (outside text fields) to export the current size.
window.addEventListener("keydown", (ev) => {
  const tag = (ev.target.tagName || "").toLowerCase();
  if ((ev.key === "e" || ev.key === "E") && tag !== "input" && tag !== "select" && tag !== "textarea") {
    exportNow();
  }
});

// ---- boot ----

rebuildPanelPicker();
syncCropControls();
const startPhoto = applyQuery();
Promise.all([
  document.fonts.load('40px Anton'),
  document.fonts.load('40px Pacifico'),
  loadImage("samples/boulevard.jpg").then((img) => { images.boulevard = img; }).catch(() => {}),
  loadImage("samples/pier.jpg").then((img) => { images.pier = img; }).catch(() => {}),
]).finally(() => {
  useSample(startPhoto);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => queueRender());
});

// Test hook for the maker's own verification (headless checks only).
window.__cover = { state, images, renderCover, exportCoverDataURL, SIZES, useSample, useUpload };
