// Vice Cover Studio — cover rendering engine.
// Pure canvas 2D, no dependencies, no network. Draws a multi-panel GTA-style
// poster cover (panels + bold display title + script subtitle + badge + heat
// meter) into any canvas at any export size.

export const COVER_TITLE = 'NEON COAST';
export const COVER_SUBTITLE = 'Vice City Nights';
export const COVER_BADGE = 'VICE CITY';

// ---------------------------------------------------------------- grades
// Every grade is a gradient map (luminance -> colour stops) plus a tint wash,
// a vignette and a grain amount. The map is what gives the Vice City
// sunset / neon look; the tint and vignette finish it.

export const GRADES = [
  {
    id: 'vice-sunset', name: 'Vice Sunset',
    stops: [[26, 11, 46], [123, 45, 94], [232, 93, 61], [255, 179, 71], [255, 243, 214]],
    tint: '#ff7a18', tintAlpha: 0.10, vignette: 0.34, grain: 0.05, mix: 0.72,
  },
  {
    id: 'neon-nights', name: 'Neon Nights',
    stops: [[5, 5, 20], [59, 15, 94], [214, 51, 132], [0, 229, 255], [234, 255, 255]],
    tint: '#ff2e88', tintAlpha: 0.08, vignette: 0.38, grain: 0.06, mix: 0.78,
  },
  {
    id: 'golden-hour', name: 'Golden Hour',
    stops: [[36, 21, 3], [122, 74, 18], [217, 142, 43], [255, 209, 102], [255, 248, 224]],
    tint: '#ffb400', tintAlpha: 0.10, vignette: 0.30, grain: 0.04, mix: 0.70,
  },
  {
    id: 'palm-noir', name: 'Palm Noir',
    stops: [[0, 0, 0], [20, 32, 28], [61, 90, 76], [157, 184, 160], [232, 245, 233]],
    tint: '#0d2b22', tintAlpha: 0.12, vignette: 0.48, grain: 0.08, mix: 0.66,
  },
  {
    id: 'hot-pink', name: 'Hot Pink',
    stops: [[28, 4, 24], [109, 15, 90], [224, 33, 138], [255, 110, 199], [255, 227, 242]],
    tint: '#ff1493', tintAlpha: 0.10, vignette: 0.32, grain: 0.05, mix: 0.76,
  },
  {
    id: 'teal-dawn', name: 'Teal Dawn',
    stops: [[2, 20, 26], [11, 61, 77], [27, 127, 142], [127, 212, 193], [234, 255, 246]],
    tint: '#00c2a8', tintAlpha: 0.09, vignette: 0.30, grain: 0.04, mix: 0.72,
  },
  {
    id: 'chrome-dusk', name: 'Chrome Dusk',
    stops: [[11, 11, 18], [44, 44, 62], [106, 106, 138], [201, 201, 222], [255, 255, 255]],
    tint: '#8a8aff', tintAlpha: 0.08, vignette: 0.36, grain: 0.07, mix: 0.62,
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// ---------------------------------------------------------------- layouts
// A layout is a function of (width, height) returning panel rects in pixels
// plus the title zone. Gaps scale with the canvas so the cover looks the
// same at every export size.

function gapFor(w, h) {
  return Math.max(4, Math.round(Math.min(w, h) * 0.008));
}

function titleZone(w, h, frac) {
  const th = Math.round(h * frac);
  return { x: 0, y: h - th, w, h: th };
}

export const LAYOUTS = [
  {
    id: 'nine-panel', name: 'Nine-Panel Grid', panels: 9,
    rects(w, h) {
      const g = gapFor(w, h);
      const top = Math.round(h * 0.74);
      const cw = (w - g * 4) / 3;
      const ch = (top - g * 4) / 3;
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({ x: g + c * (cw + g), y: g + r * (ch + g), w: cw, h: ch, tilt: 0 });
        }
      }
      return { panels: out, title: titleZone(w, h, 0.26) };
    },
  },
  {
    id: 'hero-three', name: 'Hero + Three', panels: 4,
    rects(w, h) {
      const g = gapFor(w, h);
      const top = Math.round(h * 0.74);
      const heroW = Math.round(w * 0.62);
      const sideW = w - heroW - g * 2;
      const sh = (top - g * 4) / 3;
      const out = [{ x: g, y: g, w: heroW - g, h: top - g * 2, tilt: 0 }];
      for (let r = 0; r < 3; r++) {
        out.push({ x: heroW + g, y: g + r * (sh + g), w: sideW, h: sh, tilt: 0 });
      }
      return { panels: out, title: titleZone(w, h, 0.26) };
    },
  },
  {
    id: 'tilted-snapshots', name: 'Tilted Snapshots', panels: 4,
    rects(w, h) {
      const g = gapFor(w, h);
      const top = Math.round(h * 0.72);
      const pw = (w - g * 5) / 4;
      const ph = top - g * 2;
      const tilts = [-4, 3, -2.5, 4];
      const out = [];
      for (let c = 0; c < 4; c++) {
        out.push({ x: g + c * (pw + g), y: g + (c % 2) * Math.round(ph * 0.06), w: pw, h: ph * 0.94, tilt: tilts[c] });
      }
      return { panels: out, title: titleZone(w, h, 0.28) };
    },
  },
  {
    id: 'full-bleed', name: 'Full-Bleed Hero', panels: 4,
    rects(w, h) {
      const g = gapFor(w, h);
      const heroH = Math.round(h * 0.60);
      const stripH = Math.round(h * 0.16);
      const sw = (w - g * 4) / 3;
      const out = [{ x: 0, y: 0, w, h: heroH, tilt: 0 }];
      for (let c = 0; c < 3; c++) {
        out.push({ x: g + c * (sw + g), y: heroH + g, w: sw, h: stripH, tilt: 0 });
      }
      return { panels: out, title: titleZone(w, h, 0.24) };
    },
  },
  {
    id: 'split-sunset', name: 'Split Sunset', panels: 5,
    rects(w, h) {
      const g = gapFor(w, h);
      const top = Math.round(h * 0.56);
      const leftW = Math.round(w * 0.58);
      const stripH = Math.round(h * 0.18);
      const sw = (w - g * 4) / 3;
      const out = [
        { x: g, y: g, w: leftW - g, h: top - g * 2, tilt: 0 },
        { x: leftW + g, y: g, w: w - leftW - g * 2, h: top - g * 2, tilt: 0 },
      ];
      for (let c = 0; c < 3; c++) {
        out.push({ x: g + c * (sw + g), y: top + g, w: sw, h: stripH, tilt: 0 });
      }
      return { panels: out, title: titleZone(w, h, 0.26) };
    },
  },
  {
    id: 'magazine-stack', name: 'Magazine Stack', panels: 5,
    rects(w, h) {
      const g = gapFor(w, h);
      const top = Math.round(h * 0.74);
      const leftW = Math.round(w * 0.58);
      const rightW = w - leftW - g * 2;
      const rh = (top - g * 4) / 3;
      const out = [
        { x: g, y: g, w: leftW - g, h: top - g * 2, tilt: 0 },
        { x: leftW + g, y: g, w: rightW, h: rh, tilt: 0 },
        { x: leftW + g, y: g + rh + g, w: rightW, h: rh, tilt: 0 },
        { x: leftW + g, y: g + 2 * (rh + g), w: Math.round(rightW * 0.48), h: rh, tilt: 0 },
        { x: leftW + g + Math.round(rightW * 0.48) + g, y: g + 2 * (rh + g), w: rightW - Math.round(rightW * 0.48) - g, h: rh, tilt: 0 },
      ];
      return { panels: out, title: titleZone(w, h, 0.26) };
    },
  },
  {
    id: 'six-panel-strip', name: 'Six-Panel Strip', panels: 6,
    rects(w, h) {
      const g = gapFor(w, h);
      const top = Math.round(h * 0.74);
      const cw = (w - g * 4) / 3;
      const ch = (top - g * 3) / 2;
      const out = [];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({ x: g + c * (cw + g), y: g + r * (ch + g), w: cw, h: ch, tilt: 0 });
        }
      }
      return { panels: out, title: titleZone(w, h, 0.26) };
    },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// ---------------------------------------------------------------- state

export function defaultPanel(photo) {
  // Faces usually sit in the upper half of a photo, so bias the crop up
  // (pan +1 shows the top of the photo).
  return { photo, zoom: 1, panX: 0, panY: 0.85, flip: false };
}

export function defaultState() {
  return {
    layout: 'nine-panel',
    grade: 'vice-sunset',
    title: COVER_TITLE,
    subtitle: COVER_SUBTITLE,
    badge: COVER_BADGE,
    heat: 4,
    halftone: true,
    photos: [], // { name, src, img }
    panels: Array.from({ length: 9 }, (_, i) => defaultPanel(i % 2)),
  };
}

// ---------------------------------------------------------------- grading

// Build a 256-entry lookup table for one grade: luminance -> mapped RGB.
function gradeLookup(grade) {
  const table = new Uint8Array(256 * 3);
  const stops = grade.stops;
  for (let lum = 0; lum < 256; lum++) {
    const t = lum / 255 * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(t));
    const f = t - i;
    const a = stops[i];
    const b = stops[i + 1];
    table[lum * 3] = Math.round(a[0] + (b[0] - a[0]) * f);
    table[lum * 3 + 1] = Math.round(a[1] + (b[1] - a[1]) * f);
    table[lum * 3 + 2] = Math.round(a[2] + (b[2] - a[2]) * f);
  }
  return table;
}

const grainCanvasCache = new Map();

function grainCanvas(size) {
  if (grainCanvasCache.has(size)) return grainCanvasCache.get(size);
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 256);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  grainCanvasCache.set(size, c);
  return c;
}

// Grade one photo into a panel-sized offscreen canvas and return it.
function gradedPanelImage(img, pw, ph, panel, grade) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(pw));
  c.height = Math.max(2, Math.round(ph));
  const ctx = c.getContext('2d');
  // Cover-fit with zoom, pan and optional horizontal flip. Pan is a
  // fraction of the overflow: +1 shows the top/left of the photo, -1 the
  // bottom/right, 0 the centre.
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
  const scale = base * panel.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (pw - dw) / 2 + panel.panX * Math.max(0, (dw - pw) / 2);
  const dy = (ph - dh) / 2 + panel.panY * Math.max(0, (dh - ph) / 2);
  ctx.save();
  if (panel.flip) {
    ctx.translate(pw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  ctx.restore();
  // Gradient-map grade, mixed with the original.
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  const table = gradeLookup(grade);
  const mix = grade.mix;
  for (let i = 0; i < px.length; i += 4) {
    const lum = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
    const ti = lum * 3;
    px[i] = px[i] + (table[ti] - px[i]) * mix;
    px[i + 1] = px[i + 1] + (table[ti + 1] - px[i + 1]) * mix;
    px[i + 2] = px[i + 2] + (table[ti + 2] - px[i + 2]) * mix;
  }
  ctx.putImageData(data, 0, 0);
  // Tint wash.
  if (grade.tintAlpha > 0) {
    ctx.globalAlpha = grade.tintAlpha;
    ctx.fillStyle = grade.tint;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.globalAlpha = 1;
  }
  // Vignette.
  if (grade.vignette > 0) {
    const vg = ctx.createRadialGradient(
      c.width / 2, c.height / 2, Math.min(c.width, c.height) * 0.35,
      c.width / 2, c.height / 2, Math.max(c.width, c.height) * 0.75,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(0,0,0,${grade.vignette})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  // Grain.
  if (grade.grain > 0) {
    const grain = grainCanvas(128);
    ctx.globalAlpha = grade.grain;
    ctx.globalCompositeOperation = 'overlay';
    const pattern = ctx.createPattern(grain, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  return c;
}

// ---------------------------------------------------------------- title block

function drawHalftoneDots(ctx, zone, colour, spacing, radius) {
  ctx.save();
  ctx.fillStyle = colour;
  for (let y = zone.y + spacing / 2; y < zone.y + zone.h; y += spacing) {
    for (let x = zone.x + spacing / 2; x < zone.x + zone.w; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, r, filled, colour) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = colour;
    ctx.fill();
  } else {
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(1.5, r * 0.14);
    ctx.stroke();
  }
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function drawTitleBlock(ctx, state, zone, grade, w) {
  const accent = '#ff5e3a';
  const accent2 = '#ffb347';
  // Deep band.
  const band = ctx.createLinearGradient(0, zone.y, 0, zone.y + zone.h);
  band.addColorStop(0, '#160a2e');
  band.addColorStop(1, '#0b0618');
  ctx.fillStyle = band;
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  // Top rule.
  ctx.fillStyle = accent;
  ctx.fillRect(zone.x, zone.y, zone.w, Math.max(3, zone.h * 0.03));
  // Halftone dots behind the title.
  if (state.halftone) {
    const spacing = Math.max(10, Math.round(zone.h * 0.16));
    drawHalftoneDots(ctx, zone, 'rgba(255,255,255,0.10)', spacing, Math.max(1.5, spacing * 0.14));
  }
  const padX = Math.round(w * 0.035);
  const title = (state.title || COVER_TITLE).toUpperCase();
  const subtitle = state.subtitle || '';
  const badge = state.badge || '';
  // Measure the badge ribbon first: the title must stop short of it.
  const badgePx = Math.round(zone.h * 0.16);
  const badgeLabel = badge ? `★ ${badge.toUpperCase()} ★` : '';
  let badgeW = 0;
  if (badge) {
    ctx.save();
    ctx.font = `${badgePx}px Anton, sans-serif`;
    badgeW = ctx.measureText(badgeLabel).width + badgePx * 1.6;
    ctx.restore();
  }
  // Title: huge Anton, gradient fill, hard offset shadow.
  const titleMaxW = zone.w - padX * 2 - (badge ? badgeW + padX : 0);
  const titlePx = fitFont(ctx, title, titleMaxW, Math.round(zone.h * 0.62), 'Anton, sans-serif', 400);
  const titleY = zone.y + zone.h * 0.52;
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const grad = ctx.createLinearGradient(0, titleY - titlePx * 0.55, 0, titleY + titlePx * 0.55);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, '#ffe9c9');
  grad.addColorStop(1, accent2);
  ctx.font = `${titlePx}px Anton, sans-serif`;
  ctx.fillStyle = '#ff2e88';
  ctx.fillText(title, padX + Math.max(3, titlePx * 0.06), titleY + Math.max(3, titlePx * 0.06));
  ctx.fillStyle = grad;
  ctx.fillText(title, padX, titleY);
  ctx.restore();
  // Subtitle in script, tucked under the title.
  if (subtitle) {
    const subPx = Math.round(zone.h * 0.20);
    ctx.save();
    ctx.font = `${subPx}px Pacifico, cursive`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7fe7ff';
    ctx.fillText(subtitle, padX + Math.round(w * 0.01), zone.y + zone.h * 0.84);
    ctx.restore();
  }
  // Badge ribbon, top right of the band.
  if (badge) {
    const label = badgeLabel;
    const bw = badgeW;
    const bh = badgePx * 2.1;
    const bx = zone.x + zone.w - padX - bw;
    const by = zone.y + zone.h * 0.10;
    ctx.save();
    ctx.font = `${badgePx}px Anton, sans-serif`;
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.rotate(-0.03);
    ctx.fillStyle = accent;
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }
  // Heat meter: five stars, bottom right.
  const starR = Math.round(zone.h * 0.075);
  const starGap = starR * 2.4;
  const totalW = starGap * 4 + starR * 2;
  let sx = zone.x + zone.w - padX - totalW + starR;
  const sy = zone.y + zone.h * 0.82;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, sx, sy, starR, i < state.heat, '#ffb347');
    sx += starGap;
  }
  void grade;
}

// ---------------------------------------------------------------- render

// Draw the whole cover into `canvas` at (width x height). `state.photos`
// must hold loaded Image objects; panels without a photo get a gradient
// placeholder so the cover still reads as a poster.
export function renderCover(canvas, state, width, height) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const layout = layoutById(state.layout);
  const grade = gradeById(state.grade);
  const geo = layout.rects(width, height);
  // Backdrop: deep violet so panel gaps read as poster ink.
  ctx.fillStyle = '#160a2e';
  ctx.fillRect(0, 0, width, height);
  const borderW = Math.max(3, Math.round(Math.min(width, height) * 0.006));
  for (let i = 0; i < geo.panels.length; i++) {
    const rect = geo.panels[i];
    const panel = state.panels[i] || defaultPanel(i % 2);
    const photo = state.photos[panel.photo];
    ctx.save();
    if (rect.tilt) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.tilt * Math.PI) / 180);
      ctx.translate(-rect.w / 2, -rect.h / 2);
    } else {
      ctx.translate(rect.x, rect.y);
    }
    // White poster frame around each panel.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-borderW, -borderW, rect.w + borderW * 2, rect.h + borderW * 2);
    ctx.beginPath();
    ctx.rect(0, 0, rect.w, rect.h);
    ctx.clip();
    if (photo && photo.img && photo.img.naturalWidth > 0) {
      const graded = gradedPanelImage(photo.img, rect.w, rect.h, panel, grade);
      ctx.drawImage(graded, 0, 0);
    } else {
      const ph = ctx.createLinearGradient(0, 0, rect.w, rect.h);
      ph.addColorStop(0, '#ff7a18');
      ph.addColorStop(1, '#7b2d5e');
      ctx.fillStyle = ph;
      ctx.fillRect(0, 0, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `${Math.round(rect.h * 0.16)}px Anton, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ADD PHOTO', rect.w / 2, rect.h / 2);
    }
    ctx.restore();
  }
  drawTitleBlock(ctx, state, geo.title, grade, width);
  return canvas;
}

// Export the cover as a PNG blob at one of the post sizes.
export function exportCoverPng(state, width, height) {
  const canvas = document.createElement('canvas');
  renderCover(canvas, state, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG export failed'));
    }, 'image/png');
  });
}

export const EXPORT_SIZES = [
  { id: 'square', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'landscape', label: 'Landscape 1920 × 1080', w: 1920, h: 1080 },
];
