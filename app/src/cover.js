// Vice Cover Studio — cover renderer (fresh build).
// Draws a multi-panel poster cover on any canvas at any size, from one photo
// (or one photo per panel), a caption, a layout and a colour grade.
// Everything here is deterministic: same inputs, same pixels.

export const SIZES = [
  { label: "1080 × 1080", w: 1080, h: 1080 },
  { label: "1080 × 1350", w: 1080, h: 1350 },
  { label: "1920 × 1080", w: 1920, h: 1080 },
];

export const LAYOUTS = {
  hero: { name: "Hero", panels: 1 },
  duo: { name: "Duo", panels: 2 },
  trio: { name: "Trio", panels: 3 },
  grid: { name: "Grid", panels: 4 },
};

export const GRADES = {
  sunset: {
    name: "Sunset",
    filter: "saturate(1.35) contrast(1.08) brightness(1.03)",
    wash: ["#ff2d78", "#ff9a3c"],
    washMode: "soft-light",
    washAlpha: 0.55,
    accent: "#f5c542",
    accent2: "#ff2d78",
    vignette: 0.32,
  },
  neon: {
    name: "Neon",
    filter: "saturate(1.5) contrast(1.16) hue-rotate(-14deg)",
    wash: ["#00e5ff", "#7b2fff"],
    washMode: "overlay",
    washAlpha: 0.5,
    accent: "#00e5ff",
    accent2: "#ff2d78",
    vignette: 0.36,
  },
  noir: {
    name: "Noir",
    filter: "grayscale(0.92) contrast(1.28) brightness(0.96)",
    wash: ["#1b2a4a", "#000000"],
    washMode: "multiply",
    washAlpha: 0.28,
    accent: "#f4f1ea",
    accent2: "#f5c542",
    vignette: 0.5,
  },
  palms: {
    name: "Palms",
    filter: "saturate(1.12) contrast(0.96) sepia(0.28) brightness(1.05)",
    wash: ["#0f766e", "#f5c542"],
    washMode: "soft-light",
    washAlpha: 0.45,
    accent: "#f5c542",
    accent2: "#0f766e",
    vignette: 0.26,
  },
};

export function panelCount(layout) {
  return (LAYOUTS[layout] || LAYOUTS.duo).panels;
}

export function freshPanels(layout) {
  const n = panelCount(layout);
  // Portrait-friendly defaults: low zoom, centred on the face (focusX 0.5),
  // biased to the top of the photo (focusY ~0.15) so heads, hats, sunglasses
  // and eyes are never cut at the top or side edges of any panel.
  const spots = [
    { zoom: 1.04, ox: 0, oy: 0.8 },
    { zoom: 1.06, ox: 0, oy: 0.8 },
    { zoom: 1.06, ox: 0, oy: 0.8 },
    { zoom: 1.08, ox: 0, oy: 0.8 },
  ];
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ src: "main", zoom: spots[i].zoom, ox: spots[i].ox, oy: spots[i].oy });
  }
  return out;
}

// Geometry: panels fill the area above the title band; the band sits at the bottom.
function geometry(W, H, layout) {
  const pad = Math.max(8, Math.round(W * 0.014));
  const gap = Math.max(6, Math.round(W * 0.011));
  const titleH = Math.round(H * (H >= W ? 0.27 : 0.3));
  const area = { x: pad, y: pad, w: W - pad * 2, h: H - titleH - pad * 2 };
  const panels = [];
  if (layout === "hero") {
    panels.push({ ...area });
  } else if (layout === "duo") {
    const leftW = Math.round(area.w * 0.6);
    panels.push({ x: area.x, y: area.y, w: leftW, h: area.h });
    panels.push({ x: area.x + leftW + gap, y: area.y, w: area.w - leftW - gap, h: area.h });
  } else if (layout === "trio") {
    const topH = Math.round(area.h * 0.52);
    panels.push({ x: area.x, y: area.y, w: area.w, h: topH });
    const half = Math.floor((area.w - gap) / 2);
    panels.push({ x: area.x, y: area.y + topH + gap, w: half, h: area.h - topH - gap });
    panels.push({ x: area.x + half + gap, y: area.y + topH + gap, w: area.w - half - gap, h: area.h - topH - gap });
  } else {
    const cw = Math.floor((area.w - gap) / 2);
    const ch = Math.floor((area.h - gap) / 2);
    panels.push({ x: area.x, y: area.y, w: cw, h: ch });
    panels.push({ x: area.x + cw + gap, y: area.y, w: area.w - cw - gap, h: ch });
    panels.push({ x: area.x, y: area.y + ch + gap, w: cw, h: area.h - ch - gap });
    panels.push({ x: area.x + cw + gap, y: area.y + ch + gap, w: area.w - cw - gap, h: area.h - ch - gap });
  }
  return { pad, gap, titleH, area, panels, title: { x: pad, y: H - titleH, w: W - pad * 2, h: titleH } };
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function paintPlaceholder(ctx, rect, grade) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, "#3b1d5e");
  g.addColorStop(0.55, "#c22a6b");
  g.addColorStop(1, "#ff9a3c");
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = grade.accent;
  for (let i = 0; i < 5; i++) {
    const y = rect.y + rect.h * (0.15 + i * 0.16);
    ctx.fillRect(rect.x, y, rect.w, Math.max(2, rect.h * 0.02));
  }
  ctx.restore();
}

function paintPhoto(ctx, img, rect, crop, grade) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) { paintPlaceholder(ctx, rect, grade); return; }
  const zoom = crop.zoom || 1;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (crop.ox || 0) * ((dw - rect.w) / 2);
  const dy = rect.y + (rect.h - dh) / 2 + (crop.oy || 0) * ((dh - rect.h) / 2);
  const tmp = document.createElement("canvas");
  tmp.width = Math.max(2, Math.round(rect.w));
  tmp.height = Math.max(2, Math.round(rect.h));
  const t = tmp.getContext("2d");
  t.filter = grade.filter;
  t.drawImage(img, dx - rect.x, dy - rect.y, dw, dh);
  ctx.save();
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, Math.max(4, rect.w * 0.012));
  ctx.clip();
  ctx.drawImage(tmp, rect.x, rect.y);
  ctx.restore();
}

function paintWash(ctx, area, grade) {
  const g = ctx.createLinearGradient(area.x, area.y, area.x + area.w, area.y + area.h);
  g.addColorStop(0, grade.wash[0]);
  g.addColorStop(1, grade.wash[1]);
  ctx.save();
  ctx.globalCompositeOperation = grade.washMode;
  ctx.globalAlpha = grade.washAlpha;
  ctx.fillStyle = g;
  ctx.fillRect(area.x, area.y, area.w, area.h);
  ctx.restore();
}

function paintVignette(ctx, W, H, strength) {
  const g = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.35,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function paintDecor(ctx, geo, grade, W, H) {
  const { area } = geo;
  // Soften the bottom of the photo area so the panels sit into the title band.
  const shade = ctx.createLinearGradient(0, area.y + area.h * 0.7, 0, area.y + area.h);
  shade.addColorStop(0, "rgba(8,6,16,0)");
  shade.addColorStop(1, "rgba(8,6,16,0.38)");
  ctx.fillStyle = shade;
  ctx.fillRect(area.x, area.y + area.h * 0.7, area.w, area.h * 0.3);
  // Two clean diagonal accent bars in the top-left corner.
  ctx.save();
  ctx.translate(area.x + 6, area.y + 6);
  ctx.rotate(-0.5);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, 0, area.w * 0.26, Math.max(5, W * 0.009));
  ctx.fillStyle = grade.accent2;
  ctx.fillRect(0, Math.max(8, W * 0.011), area.w * 0.18, Math.max(4, W * 0.007));
  ctx.restore();
  void H;
}

function fitTitle(ctx, text, maxW, startPx) {
  let px = startPx;
  ctx.font = `${px}px Anton, sans-serif`;
  while (px > 20 && ctx.measureText(text).width > maxW) {
    px = Math.floor(px * 0.92);
    ctx.font = `${px}px Anton, sans-serif`;
  }
  return px;
}

function paintTitleBlock(ctx, geo, state, grade, W, H) {
  const t = geo.title;
  const g = ctx.createLinearGradient(0, t.y - geo.pad, 0, t.y + t.h);
  g.addColorStop(0, "rgba(10,8,18,0)");
  g.addColorStop(0.35, "rgba(10,8,18,0.82)");
  g.addColorStop(1, "rgba(10,8,18,0.96)");
  ctx.fillStyle = g;
  ctx.fillRect(0, t.y - geo.pad, W, t.h + geo.pad);
  // Retro striped sun emblem in the title band's empty right side — sharp,
  // poster style, never over a face. Drawn first so the caption sits on top.
  const sunR = Math.round(t.h * 0.22);
  const sunX = t.x + t.w - sunR * 1.35;
  const sunY = t.y + t.h * 0.34;
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  // Solid sun disc.
  ctx.fillStyle = grade.accent2;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  // Horizontal slats across the lower half (band-dark bars, sharp edges).
  ctx.fillStyle = "rgba(10,8,18,0.96)";
  const slatH = Math.max(2, Math.round(sunR * 0.11));
  for (let i = 0; i < 3; i++) {
    const y = sunY + sunR * 0.1 + i * slatH * 2.4;
    ctx.fillRect(sunX - sunR, y, sunR * 2, slatH);
  }
  ctx.restore();
  // Thin crisp ring around the sun.
  ctx.save();
  ctx.strokeStyle = grade.accent;
  ctx.lineWidth = Math.max(2, W * 0.003);
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  const tx = t.x + W * 0.02;
  const tw = t.w - W * 0.04;
  // Accent rule above the title.
  const barY = t.y + t.h * 0.1;
  const bar = ctx.createLinearGradient(tx, 0, tx + tw * 0.45, 0);
  bar.addColorStop(0, grade.accent);
  bar.addColorStop(1, grade.accent2);
  ctx.fillStyle = bar;
  ctx.fillRect(tx, barY, tw * 0.45, Math.max(4, H * 0.007));
  // Title: sized from the band height so it can never overflow it.
  const title = (state.title || "NEON COAST").toUpperCase();
  const px = fitTitle(ctx, title, tw, Math.min(Math.round(W * 0.088), Math.round(t.h * 0.4)));
  ctx.font = `${px}px Anton, sans-serif`;
  try { ctx.letterSpacing = "2px"; } catch (e) { /* older canvas: no letter spacing */ }
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  const titleBase = barY + px * 1.18;
  ctx.fillText(title, tx, titleBase);
  try { ctx.letterSpacing = "0px"; } catch (e) { /* ignore */ }
  // Script subtitle, kept inside the band.
  const sub = state.subtitle || "";
  if (sub) {
    const subPx = Math.min(Math.round(W * 0.034), Math.round(t.h * 0.13));
    const subBase = Math.min(titleBase + subPx * 1.7, t.y + t.h - Math.max(14, H * 0.02) - 4);
    ctx.font = `${subPx}px Pacifico, cursive`;
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub, tx, subBase);
  }
  // Tag line, bottom-right of the band.
  const tag = (state.tag || "").toUpperCase();
  if (tag) {
    ctx.font = `${Math.round(W * 0.017)}px system-ui, sans-serif`;
    ctx.fillStyle = "rgba(244,241,234,0.75)";
    const twd = ctx.measureText(tag).width;
    ctx.fillText(tag, t.x + t.w - twd, t.y + t.h - Math.max(14, H * 0.02));
  }
  // "VOL. 1" pill, sitting on the tag line's baseline, just left of the tag.
  const pillText = "VOL. 1";
  const pillPx = Math.round(W * 0.016);
  const tagBase = t.y + t.h - Math.max(14, H * 0.02);
  ctx.font = `${Math.round(W * 0.017)}px system-ui, sans-serif`;
  const tagW2 = tag ? ctx.measureText(tag).width : 0;
  ctx.font = `700 ${pillPx}px system-ui, sans-serif`;
  const pillPad = Math.round(pillPx * 0.8);
  const pillW = ctx.measureText(pillText).width + pillPad * 2;
  const pillH = Math.round(pillPx * 1.9);
  const pillX = t.x + t.w - tagW2 - Math.round(W * 0.018) - pillW;
  const pillY = tagBase - pillH * 0.72;
  ctx.save();
  roundRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = grade.accent;
  ctx.fill();
  ctx.fillStyle = "#0a0812";
  ctx.textBaseline = "middle";
  ctx.fillText(pillText, pillX + pillPad, pillY + pillH / 2 + 1);
  ctx.restore();
  ctx.textBaseline = "alphabetic";
}

// Renders the whole cover onto `canvas` (resized to W x H) and returns the
// panel rectangles in canvas pixels, for hit-testing in the editor.
export function renderCover(canvas, W, H, state, images) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const grade = GRADES[state.grade] || GRADES.sunset;
  const geo = geometry(W, H, state.layout);
  ctx.fillStyle = "#0a0812";
  ctx.fillRect(0, 0, W, H);
  const panels = geo.panels;
  for (let i = 0; i < panels.length; i++) {
    const crop = state.panels[i] || { src: "main", zoom: 1.15, ox: 0, oy: 0 };
    const img = images[crop.src] || images.main || null;
    if (img) paintPhoto(ctx, img, panels[i], crop, grade);
    else paintPlaceholder(ctx, panels[i], grade);
  }
  paintWash(ctx, geo.area, grade);
  paintDecor(ctx, geo, grade, W, H);
  paintTitleBlock(ctx, geo, state, grade, W, H);
  paintVignette(ctx, W, H, grade.vignette);
  // Poster frame.
  ctx.strokeStyle = grade.accent;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.strokeRect(geo.pad / 2, geo.pad / 2, W - geo.pad, H - geo.pad);
  ctx.globalAlpha = 1;
  return panels;
}

// Renders at full export size and returns a PNG data URL.
export function exportCoverDataURL(W, H, state, images) {
  const c = document.createElement("canvas");
  renderCover(c, W, H, state, images);
  return c.toDataURL("image/png");
}
