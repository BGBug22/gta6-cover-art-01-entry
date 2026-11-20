// Vice Cover Studio — cover renderer.
// Draws the multi-panel GTA-style poster: a collage of the user's photos under a
// huge gradient title, a script subtitle, a press-quote strip on top and a credit
// strip with a gold seal and a barcode at the foot. Pure canvas 2D, no network,
// no randomness: the same state always paints the same pixels.

export const SIZES = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  wide: [1920, 1080],
};

export const GRADES = {
  sunset: {
    sky: '#2b1038',
    tintTop: 'rgba(255,120,60,0.10)',
    tintBottom: 'rgba(255,46,147,0.30)',
    title: ['#FFE95C', '#FFB347', '#FF7A3D', '#FF2E93', '#B14BFF'],
  },
  neon: {
    sky: '#12082b',
    tintTop: 'rgba(0,229,255,0.10)',
    tintBottom: 'rgba(140,40,255,0.32)',
    title: ['#8CFFF9', '#00E5FF', '#7A5CFF', '#FF2E93', '#FFD23D'],
  },
  golden: {
    sky: '#33170a',
    tintTop: 'rgba(255,200,60,0.12)',
    tintBottom: 'rgba(255,120,20,0.28)',
    title: ['#FFF3A0', '#FFD23D', '#FF9A2E', '#FF5C1F', '#C2185B'],
  },
  violet: {
    sky: '#1c0b33',
    tintTop: 'rgba(180,80,255,0.12)',
    tintBottom: 'rgba(60,10,90,0.34)',
    title: ['#FFD6FF', '#E08CFF', '#B14BFF', '#7A2EFF', '#FF2E93'],
  },
};

export const LAYOUTS = {
  'hero-center': {
    name: 'Hero Center',
    panels: [
      { x: 0, y: 0, w: 0.3, h: 0.485, rot: -1.1 },
      { x: 0, y: 0.515, w: 0.3, h: 0.485, rot: 0.9 },
      { x: 0.315, y: 0, w: 0.37, h: 1, rot: 0 },
      { x: 0.7, y: 0, w: 0.3, h: 0.485, rot: 1.1 },
      { x: 0.7, y: 0.515, w: 0.3, h: 0.485, rot: -0.9 },
    ],
  },
  'hero-left': {
    name: 'Hero Left',
    panels: [
      { x: 0, y: 0, w: 0.44, h: 1, rot: 0 },
      { x: 0.455, y: 0, w: 0.265, h: 0.485, rot: 0.9 },
      { x: 0.735, y: 0, w: 0.265, h: 0.485, rot: -0.9 },
      { x: 0.455, y: 0.515, w: 0.265, h: 0.485, rot: -0.9 },
      { x: 0.735, y: 0.515, w: 0.265, h: 0.485, rot: 0.9 },
    ],
  },
  'hero-right': {
    name: 'Hero Right',
    panels: [
      { x: 0, y: 0, w: 0.265, h: 0.485, rot: 0.9 },
      { x: 0.28, y: 0, w: 0.265, h: 0.485, rot: -0.9 },
      { x: 0, y: 0.515, w: 0.265, h: 0.485, rot: -0.9 },
      { x: 0.28, y: 0.515, w: 0.265, h: 0.485, rot: 0.9 },
      { x: 0.56, y: 0, w: 0.44, h: 1, rot: 0 },
    ],
  },
  'six-split': {
    name: 'Six Split',
    panels: [
      { x: 0, y: 0, w: 0.325, h: 0.485, rot: 0.8 },
      { x: 0.3375, y: 0, w: 0.325, h: 0.485, rot: -0.8 },
      { x: 0.675, y: 0, w: 0.325, h: 0.485, rot: 0.8 },
      { x: 0, y: 0.515, w: 0.325, h: 0.485, rot: -0.8 },
      { x: 0.3375, y: 0.515, w: 0.325, h: 0.485, rot: 0.8 },
      { x: 0.675, y: 0.515, w: 0.325, h: 0.485, rot: -0.8 },
    ],
  },
};

export const PANEL_LABELS = ['THE DRIVER', 'THE BOSS', 'THE INSIDER', 'THE RIDER', 'THE FIXER', 'THE COURIER'];

/** The art area (between the quote strip and the credit strip), in pixels. */
export function artArea(width, height) {
  const top = height * 0.062;
  const bottom = height * 0.088;
  return { x: width * 0.012, y: top + height * 0.004, w: width * 0.976, h: height - top - bottom - height * 0.008 };
}

/** Panel rectangles for a layout, in canvas pixels, each with its rotation. */
export function layoutPanels(layout, width, height) {
  const area = artArea(width, height);
  const def = LAYOUTS[layout] ?? LAYOUTS['hero-center'];
  return def.panels.map((p) => ({
    x: area.x + p.x * area.w,
    y: area.y + p.y * area.h,
    w: p.w * area.w,
    h: p.h * area.h,
    rot: p.rot,
  }));
}

/** Small deterministic hash of a string, for the barcode bars. */
export function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Draws one photo into a panel rect with cover fit, zoom and a focal point. */
export function drawPhotoInPanel(ctx, photo, rect, zoom, fx, fy) {
  if (!photo) return;
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const s = base * Math.max(1, zoom);
  const dw = iw * s;
  const dh = ih * s;
  const ox = (rect.w - dw) * fx;
  const oy = (rect.h - dh) * fy;
  ctx.drawImage(photo, rect.x + ox, rect.y + oy, dw, dh);
}

/** A tiny palm silhouette: trunk plus five fronds, drawn at (x, y) with size s. */
export function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.06, y - s * 0.55, x + s * 0.16, y - s * 0.8);
  ctx.stroke();
  const topX = x + s * 0.16;
  const topY = y - s * 0.8;
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.15 + i * 0.175);
    const ex = topX + Math.cos(a) * s * 0.42;
    const ey = topY - Math.sin(a) * s * 0.28 + s * 0.16;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * s * 0.25, topY - Math.sin(a) * s * 0.3, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

/** The gold seal: a star medallion reading ORIGINAL COVER ART. */
export function drawSeal(ctx, cx, cy, r) {
  ctx.save();
  const gold = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  gold.addColorStop(0, '#FFF3A0');
  gold.addColorStop(0.55, '#FFD23D');
  gold.addColorStop(1, '#C98A12');
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7A5200';
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#5C3D00';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${r * 0.34}px sans-serif`;
  ctx.fillText('★', cx, cy - r * 0.34);
  ctx.font = `bold ${r * 0.2}px Anton, sans-serif`;
  ctx.fillText('ORIGINAL', cx, cy + r * 0.18);
  ctx.fillText('COVER ART', cx, cy + r * 0.46);
  ctx.restore();
}

/** The barcode at the foot, its bars fixed by the title's hash. */
export function drawBarcode(ctx, x, y, w, h, seed) {
  ctx.save();
  ctx.fillStyle = '#F5EFE0';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#111111';
  let cursor = x + w * 0.06;
  let n = seed;
  while (cursor < x + w * 0.94) {
    n = (Math.imul(n, 1103515245) + 12345) >>> 0;
    const bw = w * (0.008 + (n % 5) * 0.006);
    if ((n >> 3) % 3 !== 0) ctx.fillRect(cursor, y + h * 0.08, bw, h * 0.72);
    cursor += bw + w * 0.008;
  }
  ctx.restore();
}

/** The huge gradient title with a dark outline, drop shadow and retro stripes. */
export function drawTitle(ctx, text, cx, baseline, width) {
  const clean = (text || 'PALM FEVER').trim().toUpperCase() || 'PALM FEVER';
  let size = width * 0.16;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(clean).width > width * 0.94 && size > 24) {
    size -= 4;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = size * 0.06;
  ctx.shadowOffsetY = size * 0.03;
  ctx.strokeStyle = '#1A0B2E';
  ctx.lineWidth = size * 0.16;
  ctx.strokeText(clean, cx, baseline);
  ctx.shadowColor = 'transparent';
  const grad = ctx.createLinearGradient(0, baseline - size, 0, baseline + size * 0.12);
  const stops = ['#FFE95C', '#FFB347', '#FF7A3D', '#FF2E93', '#B14BFF'];
  stops.forEach((c, i) => grad.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = grad;
  ctx.fillText(clean, cx, baseline);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(26,11,46,0.14)';
  const top = baseline - size;
  for (let yy = top + size * 0.18; yy < baseline; yy += size * 0.22) {
    ctx.fillRect(cx - width * 0.5, yy, width, size * 0.07);
  }
  ctx.restore();
  return size;
}

/**
 * Draws the whole cover onto `canvas` (at its own pixel size).
 * `art` holds the texts, layout, grade and one panel entry per panel:
 * { photo, zoom, fx, fy, label }. `photos` is the pool of loaded images.
 */
export function drawCover(canvas, art, photos) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[art.grade] ?? GRADES.sunset;
  const rects = layoutPanels(art.layout, W, H);

  ctx.fillStyle = grade.sky;
  ctx.fillRect(0, 0, W, H);
  const skyGlow = ctx.createRadialGradient(W * 0.5, H * 0.1, 10, W * 0.5, H * 0.1, W * 0.75);
  skyGlow.addColorStop(0, 'rgba(255,140,80,0.35)');
  skyGlow.addColorStop(1, 'rgba(255,140,80,0)');
  ctx.fillStyle = skyGlow;
  ctx.fillRect(0, 0, W, H);

  // Quote strip on top: five gold stars, the press quote, the paper's name.
  const topH = H * 0.062;
  ctx.fillStyle = 'rgba(10,4,20,0.92)';
  ctx.fillRect(0, 0, W, topH);
  let qSize = Math.max(12, H * 0.026);
  const stars = '★★★★★';
  const quote = `“${(art.quote || '').trim().toUpperCase()}” — ${(art.paper || '').trim().toUpperCase()}`;
  const vol = (art.volume || 'VOL. 1').trim().toUpperCase();
  // The volume badge sits top-right, so the quote is centred in the space left
  // of it and shrunk until it fits there instead of running under the badge.
  const measureQuote = (size) => {
    ctx.font = `bold ${size}px sans-serif`;
    const head = ctx.measureText(stars + '  ').width;
    ctx.font = `italic bold ${size}px Georgia, serif`;
    return head + ctx.measureText(quote).width;
  };
  ctx.font = `bold ${qSize * 0.92}px Anton, sans-serif`;
  const volW = ctx.measureText(vol).width + qSize * 1.1;
  const freeW = W - volW - W * 0.03;
  while (measureQuote(qSize) > freeW && qSize > 10) qSize -= 1;
  const quoteW = measureQuote(qSize);
  let qx = (freeW - quoteW) / 2;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFD23D';
  ctx.font = `bold ${qSize}px sans-serif`;
  ctx.fillText(stars, qx, topH / 2);
  qx += ctx.measureText(stars + '  ').width;
  ctx.fillStyle = '#FFF3D6';
  ctx.font = `italic bold ${qSize}px Georgia, serif`;
  ctx.fillText(quote, qx, topH / 2);
  // Volume badge, top right.
  ctx.font = `bold ${qSize * 0.92}px Anton, sans-serif`;
  ctx.fillStyle = '#FFD23D';
  ctx.beginPath();
  ctx.roundRect(W - volW - W * 0.012, topH * 0.14, volW, topH * 0.72, topH * 0.36);
  ctx.fill();
  ctx.fillStyle = '#1A0B2E';
  ctx.textAlign = 'center';
  ctx.fillText(vol, W - volW / 2 - W * 0.012, topH * 0.52);

  // Photo panels.
  rects.forEach((rect, i) => {
    const panel = art.panels[i] || {};
    const photo = photos[panel.photo ?? 0] || photos[0] || null;
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((rect.rot * Math.PI) / 180);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    ctx.beginPath();
    ctx.rect(0, 0, rect.w, rect.h);
    ctx.clip();
    if (photo) {
      drawPhotoInPanel(ctx, photo, { x: 0, y: 0, w: rect.w, h: rect.h }, panel.zoom ?? 1, panel.fx ?? 0.5, panel.fy ?? 0.5);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, rect.h);
      g.addColorStop(0, '#FF7A3D');
      g.addColorStop(1, '#B14BFF');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, rect.w, rect.h);
    }
    const tint = ctx.createLinearGradient(0, 0, 0, rect.h);
    tint.addColorStop(0, grade.tintTop);
    tint.addColorStop(1, grade.tintBottom);
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, rect.w, rect.h);
    ctx.restore();
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((rect.rot * Math.PI) / 180);
    ctx.strokeStyle = 'rgba(255,210,61,0.85)';
    ctx.lineWidth = Math.max(2, W * 0.002);
    ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.restore();
    // Character label on the panel.
    const label = (panel.label || PANEL_LABELS[i] || '').trim().toUpperCase();
    if (label) {
      const lSize = Math.max(11, W * 0.016);
      ctx.font = `${lSize}px Anton, sans-serif`;
      const lw = ctx.measureText(label).width + lSize * 1.2;
      const lh = lSize * 1.9;
      const lx = rect.x + rect.w * 0.03;
      // A bottom label under the centred title and subtitle would be hidden,
      // so a middle-column panel whose foot is in the title zone gets its
      // label at the top instead; side panels keep the bottom label.
      const centreX = rect.x + rect.w / 2;
      const inTitleZone = rect.y + rect.h > H * 0.62 && centreX > W * 0.25 && centreX < W * 0.75;
      const ly = inTitleZone ? rect.y + rect.h * 0.04 : rect.y + rect.h - lh - rect.h * 0.04;
      ctx.fillStyle = 'rgba(10,4,20,0.88)';
      ctx.beginPath();
      ctx.roundRect(lx, ly, lw, lh, lh * 0.2);
      ctx.fill();
      ctx.fillStyle = '#FF2E93';
      ctx.fillRect(lx, ly, lSize * 0.22, lh);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx + lSize * 0.5, ly + lh / 2 + 1);
    }
  });

  // The title, its script subtitle and the tagline ribbon.
  const titleSize = drawTitle(ctx, art.title, W / 2, H * 0.8, W);
  const sub = (art.subtitle || '').trim();
  if (sub) {
    ctx.save();
    ctx.translate(W / 2, H * 0.83);
    ctx.rotate(-0.035);
    ctx.font = `${Math.max(16, W * 0.046)}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#FF2E93';
    ctx.shadowBlur = W * 0.012;
    ctx.fillStyle = '#FF8AD8';
    ctx.fillText(sub, 0, 0);
    ctx.restore();
  }
  const tag = (art.tagline || '').trim().toUpperCase();
  if (tag) {
    const tSize = Math.max(11, W * 0.017);
    ctx.font = `bold ${tSize}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(1, W * 0.0015)}px`; } catch (e) { /* older canvas: no letter spacing */ }
    const tw = Math.min(W * 0.86, ctx.measureText(tag).width + tSize * 2.4);
    const th = tSize * 2.1;
    const tx = (W - tw) / 2;
    const ty = H * 0.876;
    ctx.fillStyle = 'rgba(8,3,16,0.94)';
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw, th, th * 0.18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,210,61,0.7)';
    ctx.lineWidth = Math.max(1, W * 0.001);
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, W / 2, ty + th / 2 + 1);
    try { ctx.letterSpacing = '0px'; } catch (e) { /* ignore */ }
  }

  // Gold seal overlapping the art's lower right.
  drawSeal(ctx, W * 0.925, H * 0.845, Math.max(26, Math.min(W, H) * 0.052));

  // Credit strip at the foot.
  const botY = H * 0.912;
  ctx.fillStyle = '#14081F';
  ctx.fillRect(0, botY, W, H - botY);
  ctx.fillStyle = 'rgba(255,210,61,0.8)';
  ctx.fillRect(0, botY, W, Math.max(1, H * 0.002));
  drawPalm(ctx, W * 0.055, H * 0.995, H * 0.055, 'rgba(255,46,147,0.5)');
  drawPalm(ctx, W * 0.085, H * 0.995, H * 0.042, 'rgba(0,229,255,0.4)');
  const cSize = Math.max(10, W * 0.0135);
  ctx.font = `bold ${cSize}px Anton, sans-serif`;
  ctx.fillStyle = '#FF8AD8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMING SOON', W * 0.13, botY + (H - botY) / 2);
  ctx.fillStyle = '#CBB8D8';
  ctx.textAlign = 'center';
  ctx.font = `${cSize}px Georgia, serif`;
  ctx.fillText((art.credit || '').trim().toUpperCase(), W * 0.52, botY + (H - botY) / 2);
  drawBarcode(ctx, W * 0.885, botY + (H - botY) * 0.16, W * 0.095, (H - botY) * 0.68, hashString(art.title || 'PALM FEVER'));
  return titleSize;
}
