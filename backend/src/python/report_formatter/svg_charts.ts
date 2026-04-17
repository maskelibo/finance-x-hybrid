/**
 * Inline SVG chart generators — zero dependencies, institutional grade.
 *
 * Produces compact, print-safe SVG strings that embed directly in
 * the HTML template.  Every function returns '' when data is
 * insufficient so the template's {{#if}} guards hide the block.
 *
 * Design language: Goldman Sachs / Morgan Stanley research aesthetic —
 * navy primary, gold accents, subtle gradients, clean grid, professional
 * typography.  Consistent container styling across all chart types.
 */

// ─── Design System ────────────────────────────────────────────────
const COLORS = {
  // Core palette — institutional navy/gold
  primary: '#1a365d',
  primaryDark: '#0f2440',
  primaryLight: '#3182ce',
  primaryMuted: '#4a6fa5',
  accent: '#c6973f',         // Gold
  accentDark: '#a07730',
  accentLight: '#e0b85c',
  success: '#276749',
  successLight: '#48bb78',
  danger: '#9b2c2c',
  dangerLight: '#fc8181',
  warning: '#c05621',
  warningLight: '#ed8936',
  muted: '#718096',
  mutedLight: '#a0aec0',
  grid: '#e2e8f0',
  gridLight: '#edf2f7',
  gridDark: '#cbd5e0',
  text: '#1a202c',
  textMuted: '#718096',
  textLight: '#a0aec0',
  bg: '#ffffff',
  bgAlt: '#f7fafc',
  bgPanel: '#fafbfd',
  // Semantic series colors (6, enough for most charts)
  series: ['#1a365d', '#c6973f', '#276749', '#9b2c2c', '#553c9a', '#2b6cb0'],
  seriesLight: ['#3182ce', '#e0b85c', '#48bb78', '#fc8181', '#9f7aea', '#63b3ed'],
};

const FONT = `-apple-system, 'SF Pro Display', 'Segoe UI', 'Inter', sans-serif`;
const FONT_MONO = `'SF Mono', 'Fira Code', ui-monospace, Consolas, monospace`;

// ─── Shared helpers ───────────────────────────────────────────────

function niceNumber(v: number): number {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000_000) return Math.round(v / 1_000_000_000_000 * 10) / 10;
  if (abs >= 1_000_000_000) return Math.round(v / 1_000_000_000 * 10) / 10;
  if (abs >= 1_000_000) return Math.round(v / 1_000_000 * 10) / 10;
  return Math.round(v * 100) / 100;
}

function niceUnit(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000_000) return 'T';
  if (abs >= 1_000_000_000) return 'B';
  if (abs >= 1_000_000) return 'M';
  return '';
}

function formatTick(v: number): string {
  const n = niceNumber(v);
  const u = niceUnit(v);
  return `${n.toLocaleString('tr-TR')}${u}`;
}

function escapeSvg(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Standard chart container with consistent styling */
function chartContainer(
  width: number, height: number, id: string,
  opts: { borderRadius?: number; shadow?: boolean } = {},
): { open: string; defs: string; bgRect: string; close: string } {
  const br = opts.borderRadius ?? 10;
  const shadow = opts.shadow !== false;
  return {
    open: `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:${width}px;height:auto;font-family:${FONT};">`,
    defs: `<defs>
  <linearGradient id="${id}_bgG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${COLORS.bg}"/><stop offset="100%" stop-color="${COLORS.bgPanel}"/>
  </linearGradient>
  ${shadow ? `<filter id="${id}_sh" x="-3%" y="-3%" width="106%" height="106%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
    <feOffset dx="0" dy="1.5"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.12"/></feComponentTransfer>
    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>` : ''}
</defs>`,
    bgRect: `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#${id}_bgG)" rx="${br}" stroke="${COLORS.grid}" stroke-width="0.5"/>`,
    close: '</svg>',
  };
}

/** Title element — consistent across charts */
function chartTitle(text: string, width: number, y = 28): string {
  if (!text) return '';
  return `<text x="${width / 2}" y="${y}" text-anchor="middle" font-size="14" font-weight="700" fill="${COLORS.text}" letter-spacing="-0.2">${escapeSvg(text)}</text>`;
}

// ─── LINE CHART ───────────────────────────────────────────────────

export interface LineSeries {
  name: string;
  color?: string;
  values: Array<number | null>;
}

export function lineChart(xLabels: string[], series: LineSeries[], title = ''): string {
  if (xLabels.length === 0 || series.every(s => s.values.every(v => v == null))) return '';

  const width = 900;
  const height = 440;
  const padL = 85;
  const padR = 35;
  const padT = title ? 55 : 30;
  const padB = 80;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const allVals = series.flatMap(s => s.values.filter((v): v is number => v != null && Number.isFinite(v)));
  if (allVals.length === 0) return '';
  const yMin = Math.min(...allVals, 0);
  const yMax = Math.max(...allVals);
  const yRange = yMax - yMin || 1;
  const yPadded = yRange * 0.12;
  const yLo = yMin - yPadded;
  const yHi = yMax + yPadded;

  const xStep = plotW / Math.max(1, xLabels.length - 1);
  const xScale = (i: number) => padL + i * xStep;
  const yScale = (v: number) => padT + plotH - ((v - yLo) / (yHi - yLo)) * plotH;

  const c = chartContainer(width, height, 'lc');
  const p: string[] = [c.open];

  // Defs: background gradient + area gradients per series
  let defs = c.defs.replace('</defs>', '');
  series.forEach((s, si) => {
    const color = s.color || COLORS.series[si % COLORS.series.length];
    defs += `
  <linearGradient id="lc_areaG${si}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${color}" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
  </linearGradient>`;
  });
  defs += '</defs>';
  p.push(defs);

  p.push(c.bgRect);

  // Plot area background
  p.push(`<rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="${COLORS.bgAlt}" rx="3"/>`);

  // Title
  if (title) p.push(chartTitle(title, width, 32));

  // Y gridlines — thinner, elegant
  const yTicks = 6;
  for (let i = 0; i <= yTicks; i++) {
    const v = yLo + (yHi - yLo) * (i / yTicks);
    const y = yScale(v);
    p.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="${i === 0 ? COLORS.gridDark : COLORS.gridLight}" stroke-width="${i === 0 ? 1 : 0.5}"/>`);
    p.push(`<text x="${padL - 10}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="10" font-weight="500" fill="${COLORS.textMuted}">${formatTick(v)}</text>`);
  }

  // X labels
  xLabels.forEach((lbl, i) => {
    const x = xScale(i);
    p.push(`<line x1="${x.toFixed(1)}" y1="${padT}" x2="${x.toFixed(1)}" y2="${padT + plotH}" stroke="${COLORS.gridLight}" stroke-width="0.5"/>`);
    p.push(`<text x="${x.toFixed(1)}" y="${padT + plotH + 20}" text-anchor="middle" font-size="11" font-weight="600" fill="${COLORS.text}">${escapeSvg(lbl)}</text>`);
  });

  // Series: area fill + line + dots
  series.forEach((s, si) => {
    const color = s.color || COLORS.series[si % COLORS.series.length];
    const pts = s.values.map((v, i) => v != null && Number.isFinite(v) ? [xScale(i), yScale(v)] as const : null);

    // Area fill (gradient)
    const validPts = pts.filter((p): p is readonly [number, number] => p != null);
    if (validPts.length >= 2) {
      let areaPath = `M${validPts[0][0].toFixed(1)},${yScale(yLo).toFixed(1)}`;
      validPts.forEach(pt => { areaPath += ` L${pt[0].toFixed(1)},${pt[1].toFixed(1)}`; });
      areaPath += ` L${validPts[validPts.length - 1][0].toFixed(1)},${yScale(yLo).toFixed(1)} Z`;
      p.push(`<path d="${areaPath}" fill="url(#lc_areaG${si})"/>`);
    }

    // Line
    let linePath = '';
    let pen = false;
    pts.forEach(pt => {
      if (pt == null) { pen = false; return; }
      linePath += `${pen ? 'L' : 'M'}${pt[0].toFixed(1)},${pt[1].toFixed(1)} `;
      pen = true;
    });
    p.push(`<path d="${linePath.trim()}" stroke="${color}" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`);

    // Data points
    pts.forEach((pt, i) => {
      if (pt) {
        p.push(`<circle cx="${pt[0].toFixed(1)}" cy="${pt[1].toFixed(1)}" r="4.5" fill="${COLORS.bg}" stroke="${color}" stroke-width="2.5"/>`);
        p.push(`<circle cx="${pt[0].toFixed(1)}" cy="${pt[1].toFixed(1)}" r="1.8" fill="${color}"/>`);
        // Value label on top
        const val = s.values[i];
        if (val != null) {
          p.push(`<text x="${pt[0].toFixed(1)}" y="${(pt[1] - 10).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="600" fill="${color}">${formatTick(val)}</text>`);
        }
      }
    });
  });

  // Legend — clean horizontal layout
  const legendY = height - 22;
  let lx = padL;
  series.forEach((s, si) => {
    const color = s.color || COLORS.series[si % COLORS.series.length];
    p.push(`<line x1="${lx}" y1="${legendY}" x2="${lx + 20}" y2="${legendY}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);
    p.push(`<circle cx="${lx + 10}" cy="${legendY}" r="3" fill="${COLORS.bg}" stroke="${color}" stroke-width="2"/>`);
    p.push(`<text x="${lx + 28}" y="${legendY + 4}" font-size="11" font-weight="600" fill="${COLORS.text}">${escapeSvg(s.name)}</text>`);
    lx += Math.max(140, s.name.length * 8 + 50);
  });

  p.push(c.close);
  return p.join('');
}


// ─── BAR CHART ────────────────────────────────────────────────────

export interface BarGroup {
  label: string;
  companyValue: number | null;
  medianValue: number | null;
}

export function barChart(groups: BarGroup[], title = ''): string {
  if (groups.every(g => g.companyValue == null && g.medianValue == null)) return '';

  const width = 860;
  const height = 380;
  const padL = 75;
  const padR = 30;
  const padT = title ? 55 : 28;
  const padB = 80;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const allVals = groups.flatMap(g => [g.companyValue, g.medianValue].filter((v): v is number => v != null));
  if (allVals.length === 0) return '';
  const yMax = Math.max(...allVals) * 1.18;
  const yMin = Math.min(0, ...allVals);
  const yScale = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const groupW = plotW / groups.length;
  const barW = groupW * 0.32;

  const c = chartContainer(width, height, 'bc');
  const p: string[] = [c.open];

  // Defs with gradient bars
  let defs = c.defs.replace('</defs>', '');
  defs += `
  <linearGradient id="bc_compG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${COLORS.primaryLight}"/><stop offset="100%" stop-color="${COLORS.primary}"/>
  </linearGradient>
  <linearGradient id="bc_medG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${COLORS.accentLight}"/><stop offset="100%" stop-color="${COLORS.accent}"/>
  </linearGradient>`;
  defs += '</defs>';
  p.push(defs, c.bgRect);

  p.push(`<rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="${COLORS.bgAlt}" rx="2"/>`);
  if (title) p.push(chartTitle(title, width, 34));

  // Y gridlines
  for (let i = 0; i <= 5; i++) {
    const v = yMin + (yMax - yMin) * (i / 5);
    const y = yScale(v);
    p.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="${i === 0 ? COLORS.gridDark : COLORS.gridLight}" stroke-width="${i === 0 ? 1 : 0.5}"/>`);
    p.push(`<text x="${padL - 10}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="10" font-weight="500" fill="${COLORS.textMuted}">${formatTick(v)}</text>`);
  }

  groups.forEach((g, i) => {
    const cx = padL + i * groupW + groupW / 2;
    const x0 = cx - barW - 2;
    const x1 = cx + 2;
    const bw = barW;

    if (g.companyValue != null) {
      const y0 = yScale(g.companyValue);
      const h0 = Math.abs(yScale(0) - y0);
      p.push(`<rect x="${x0.toFixed(1)}" y="${Math.min(y0, yScale(0)).toFixed(1)}" width="${bw.toFixed(1)}" height="${h0.toFixed(1)}" fill="url(#bc_compG)" rx="3"/>`);
      p.push(`<text x="${(x0 + bw / 2).toFixed(1)}" y="${(y0 - 7).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${COLORS.primary}">${formatTick(g.companyValue)}</text>`);
    }
    if (g.medianValue != null) {
      const y1 = yScale(g.medianValue);
      const h1 = Math.abs(yScale(0) - y1);
      p.push(`<rect x="${x1.toFixed(1)}" y="${Math.min(y1, yScale(0)).toFixed(1)}" width="${bw.toFixed(1)}" height="${h1.toFixed(1)}" fill="url(#bc_medG)" rx="3"/>`);
      p.push(`<text x="${(x1 + bw / 2).toFixed(1)}" y="${(y1 - 7).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${COLORS.accent}">${formatTick(g.medianValue)}</text>`);
    }

    // X label — wrap long labels
    const lbl = g.label.length > 14 ? g.label.slice(0, 14) + '…' : g.label;
    p.push(`<text x="${cx.toFixed(1)}" y="${padT + plotH + 18}" text-anchor="middle" font-size="10" font-weight="600" fill="${COLORS.text}">${escapeSvg(lbl)}</text>`);
  });

  // Legend
  const lgY = height - 22;
  p.push(`<rect x="${padL}" y="${lgY - 8}" width="16" height="12" fill="url(#bc_compG)" rx="2"/>`);
  p.push(`<text x="${padL + 22}" y="${lgY + 1}" font-size="11" font-weight="600" fill="${COLORS.text}">Şirket</text>`);
  p.push(`<rect x="${padL + 100}" y="${lgY - 8}" width="16" height="12" fill="url(#bc_medG)" rx="2"/>`);
  p.push(`<text x="${padL + 122}" y="${lgY + 1}" font-size="11" font-weight="600" fill="${COLORS.text}">Sektör Medyanı</text>`);

  p.push(c.close);
  return p.join('');
}


// ─── TIMELINE CHART ───────────────────────────────────────────────

export interface TimelineEvent {
  date: string;
  label: string;
  direction?: 'positive' | 'negative' | 'neutral' | 'mixed' | 'uncertain';
}

export function timelineChart(events: TimelineEvent[], title = ''): string {
  const valid = events
    .filter(e => /^\d{4}-\d{2}-\d{2}/.test(e.date))
    .map(e => ({ ...e, ts: Date.parse(e.date.slice(0, 10)) }))
    .filter(e => Number.isFinite(e.ts))
    .sort((a, b) => a.ts - b.ts);
  if (valid.length < 2) return '';

  const width = 860;
  const height = 200;
  const padL = 50;
  const padR = 30;
  const padT = title ? 45 : 22;
  const padB = 35;
  const plotW = width - padL - padR;
  const yMid = padT + (height - padT - padB) / 2;

  const tMin = valid[0].ts;
  const tMax = valid[valid.length - 1].ts;
  const xScale = (t: number) => padL + ((t - tMin) / Math.max(1, tMax - tMin)) * plotW;

  const dirColor: Record<string, string> = {
    positive: COLORS.success, negative: COLORS.danger,
    neutral: COLORS.muted, mixed: COLORS.warning, uncertain: COLORS.mutedLight,
  };

  const c = chartContainer(width, height, 'tl');
  const p: string[] = [c.open, c.defs, c.bgRect];
  if (title) p.push(chartTitle(title, width, 28));

  // Axis
  p.push(`<line x1="${padL}" y1="${yMid}" x2="${width - padR}" y2="${yMid}" stroke="${COLORS.gridDark}" stroke-width="1.5"/>`);

  // Month ticks
  const months = Math.max(1, Math.round((tMax - tMin) / (30 * 86400000)));
  const tickStep = Math.ceil(months / 8);
  const start = new Date(tMin);
  for (let i = 0; i <= months; i += tickStep) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const x = xScale(d.getTime());
    if (x >= padL && x <= width - padR) {
      p.push(`<line x1="${x}" y1="${yMid - 3}" x2="${x}" y2="${yMid + 3}" stroke="${COLORS.textMuted}" stroke-width="0.8"/>`);
      p.push(`<text x="${x}" y="${yMid + 16}" text-anchor="middle" font-size="8" fill="${COLORS.textMuted}">${d.toISOString().slice(0, 7)}</text>`);
    }
  }

  // Events — alternating above/below with connecting line
  valid.slice(0, 20).forEach((e, i) => {
    const x = xScale(e.ts);
    const above = i % 2 === 0;
    const pinLen = 28;
    const y = above ? yMid - pinLen : yMid + pinLen;
    const lblY = above ? y - 10 : y + 14;
    const color = dirColor[e.direction ?? 'neutral'] || COLORS.muted;

    p.push(`<line x1="${x}" y1="${yMid}" x2="${x}" y2="${y}" stroke="${color}" stroke-width="1.2" stroke-dasharray="2,2"/>`);
    p.push(`<circle cx="${x}" cy="${y}" r="4.5" fill="${COLORS.bg}" stroke="${color}" stroke-width="2"/>`);
    p.push(`<circle cx="${x}" cy="${y}" r="2" fill="${color}"/>`);

    const lblTrunc = e.label.length > 28 ? e.label.slice(0, 28) + '…' : e.label;
    p.push(`<text x="${x}" y="${lblY}" text-anchor="middle" font-size="7.5" font-weight="500" fill="${COLORS.text}">${escapeSvg(lblTrunc)}</text>`);
  });

  p.push(c.close);
  return p.join('');
}


// ─── PIE / DONUT CHART ───────────────────────────────────────────

export interface PieSlice {
  label: string;
  value: number;
  color?: string;
}

export function pieChart(slices: PieSlice[], title = ''): string {
  const filtered = slices.filter(s => s.value > 0);
  if (filtered.length === 0) return '';

  const width = 640;
  const height = 380;
  const cx = 190;
  const cy = height / 2 + (title ? 12 : 0);
  const r = 135;
  const innerR = 60;
  const total = filtered.reduce((a, s) => a + s.value, 0);

  const sliceColors = [
    COLORS.primary, COLORS.accent, COLORS.success, COLORS.danger,
    '#553c9a', '#2b6cb0', '#b83280', '#0f766e',
  ];

  const c = chartContainer(width, height, 'pie');
  const p: string[] = [c.open];

  // Defs with drop shadow for slices
  let defs = c.defs.replace('</defs>', '');
  defs += `
  <filter id="pie_sliceSh" x="-5%" y="-5%" width="110%" height="110%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
    <feOffset dx="0" dy="1"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.08"/></feComponentTransfer>
    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;
  defs += '</defs>';
  p.push(defs, c.bgRect);

  if (title) p.push(chartTitle(title, width, 28));

  let angleStart = -Math.PI / 2;
  filtered.forEach((s, i) => {
    const frac = s.value / total;
    const angleEnd = angleStart + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const color = s.color || sliceColors[i % sliceColors.length];

    // Outer arc → inner arc (donut)
    const x1Out = cx + Math.cos(angleStart) * r;
    const y1Out = cy + Math.sin(angleStart) * r;
    const x2Out = cx + Math.cos(angleEnd) * r;
    const y2Out = cy + Math.sin(angleEnd) * r;
    const x1In = cx + Math.cos(angleEnd) * innerR;
    const y1In = cy + Math.sin(angleEnd) * innerR;
    const x2In = cx + Math.cos(angleStart) * innerR;
    const y2In = cy + Math.sin(angleStart) * innerR;

    p.push(`<path d="M${x1Out.toFixed(1)},${y1Out.toFixed(1)} A${r},${r} 0 ${large} 1 ${x2Out.toFixed(1)},${y2Out.toFixed(1)} L${x1In.toFixed(1)},${y1In.toFixed(1)} A${innerR},${innerR} 0 ${large} 0 ${x2In.toFixed(1)},${y2In.toFixed(1)} Z" fill="${color}" stroke="${COLORS.bg}" stroke-width="2.5" filter="url(#pie_sliceSh)"/>`);

    // Percentage label inside slice (>= 6%)
    if (frac >= 0.06) {
      const midAngle = (angleStart + angleEnd) / 2;
      const lblR = (r + innerR) / 2;
      const lx = cx + Math.cos(midAngle) * lblR;
      const ly = cy + Math.sin(midAngle) * lblR;
      p.push(`<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="white" style="text-shadow:0 1px 2px rgba(0,0,0,0.3)">${(frac * 100).toFixed(1)}%</text>`);
    }

    // Right-side legend
    const lgY = 55 + i * 32;
    p.push(`<rect x="370" y="${lgY}" width="20" height="18" fill="${color}" rx="4"/>`);
    p.push(`<text x="398" y="${lgY + 13}" font-size="11" font-weight="500" fill="${COLORS.text}">${escapeSvg(s.label)}</text>`);
    p.push(`<text x="${width - 22}" y="${lgY + 13}" text-anchor="end" font-size="11" font-weight="700" fill="${COLORS.textMuted}" font-family="${FONT_MONO}">${(frac * 100).toFixed(1)}%</text>`);

    angleStart = angleEnd;
  });

  // Center label
  p.push(`<circle cx="${cx}" cy="${cy}" r="${innerR - 8}" fill="${COLORS.bgAlt}" stroke="${COLORS.grid}" stroke-width="0.5"/>`);
  p.push(`<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="10" font-weight="600" fill="${COLORS.textMuted}">Toplam</text>`);
  p.push(`<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="15" font-weight="800" fill="${COLORS.text}" font-family="${FONT_MONO}">%100</text>`);

  p.push(c.close);
  return p.join('');
}


// ─── RADAR CHART ──────────────────────────────────────────────────

export interface RadarAxis {
  label: string;
  value: number;   // 0-100
}

export function radarChart(axes: RadarAxis[], title = ''): string {
  if (axes.length < 3) return '';

  const width = 460;
  const height = 360;
  const cx = width / 2;
  const cy = height / 2 + (title ? 12 : 0);
  const r = 120;
  const n = axes.length;
  const angleStep = (Math.PI * 2) / n;

  const c = chartContainer(width, height, 'rad');
  const p: string[] = [c.open];

  let defs = c.defs.replace('</defs>', '');
  defs += `
  <radialGradient id="rad_fillG" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="${COLORS.primaryLight}" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="${COLORS.primary}" stop-opacity="0.08"/>
  </radialGradient>`;
  defs += '</defs>';
  p.push(defs, c.bgRect);

  if (title) p.push(chartTitle(title, width, 24));

  // Grid rings — concentric polygons with labels
  [20, 40, 60, 80, 100].forEach(level => {
    const rr = (r * level) / 100;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + i * angleStep;
      return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
    }).join(' ');
    p.push(`<polygon points="${pts}" fill="none" stroke="${COLORS.grid}" stroke-width="${level === 100 ? 1 : 0.5}"/>`);
    // Scale label on first axis
    const scaleA = -Math.PI / 2;
    const sx = cx + Math.cos(scaleA) * rr + 10;
    const sy = cy + Math.sin(scaleA) * rr + 3;
    p.push(`<text x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" font-size="8" fill="${COLORS.textLight}">${level}</text>`);
  });

  // Axis lines + labels
  axes.forEach((ax, i) => {
    const a = -Math.PI / 2 + i * angleStep;
    const x2 = cx + Math.cos(a) * r;
    const y2 = cy + Math.sin(a) * r;
    p.push(`<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${COLORS.grid}" stroke-width="0.8"/>`);
    const labelR = r + 22;
    const lx = cx + Math.cos(a) * labelR;
    const ly = cy + Math.sin(a) * labelR;
    p.push(`<text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="600" fill="${COLORS.text}">${escapeSvg(ax.label)}</text>`);
  });

  // Data polygon with gradient fill
  const dataPts = axes.map((ax, i) => {
    const a = -Math.PI / 2 + i * angleStep;
    const rr = (r * Math.min(100, Math.max(0, ax.value))) / 100;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }).join(' ');
  p.push(`<polygon points="${dataPts}" fill="url(#rad_fillG)" stroke="${COLORS.primary}" stroke-width="2"/>`);

  // Data points with value labels
  axes.forEach((ax, i) => {
    const a = -Math.PI / 2 + i * angleStep;
    const rr = (r * Math.min(100, Math.max(0, ax.value))) / 100;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    p.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${COLORS.bg}" stroke="${COLORS.primary}" stroke-width="2"/>`);
    p.push(`<text x="${x.toFixed(1)}" y="${(y - 9).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="${COLORS.primary}" font-family="${FONT_MONO}">${ax.value.toFixed(0)}</text>`);
  });

  p.push(c.close);
  return p.join('');
}


// ─── PRICE BAND CHART ─────────────────────────────────────────────

export interface PriceBandInput {
  lastClose: number;
  support1?: number;
  support2?: number;
  resistance1?: number;
  resistance2?: number;
  bearTarget?: number;
  baseTarget?: number;
  bullTarget?: number;
}

export function priceBandChart(input: PriceBandInput, title = ''): string {
  const values = [
    input.lastClose, input.support1, input.support2,
    input.resistance1, input.resistance2,
    input.bearTarget, input.baseTarget, input.bullTarget,
  ].filter((v): v is number => v != null && Number.isFinite(v));
  if (values.length < 2) return '';

  const width = 860;
  const height = 200;
  const padL = 40;
  const padR = 40;
  const padT = title ? 48 : 25;
  const padB = 40;
  const plotW = width - padL - padR;
  const axisY = padT + (height - padT - padB) / 2;

  const min = Math.min(...values) * 0.94;
  const max = Math.max(...values) * 1.06;
  const xScale = (v: number) => padL + ((v - min) / (max - min)) * plotW;

  const c = chartContainer(width, height, 'pb');
  const p: string[] = [c.open];

  let defs = c.defs.replace('</defs>', '');
  // Support zone (green gradient)
  const s2x = input.support2 != null ? xScale(input.support2) : padL;
  const s1x = input.support1 != null ? xScale(input.support1) : padL;
  const r1x = input.resistance1 != null ? xScale(input.resistance1) : width - padR;
  const r2x = input.resistance2 != null ? xScale(input.resistance2) : width - padR;
  defs += '</defs>';
  p.push(defs, c.bgRect);

  if (title) p.push(chartTitle(title, width, 30));

  // Color zones background
  if (input.support2 != null && input.support1 != null) {
    p.push(`<rect x="${s2x.toFixed(1)}" y="${axisY - 22}" width="${(s1x - s2x).toFixed(1)}" height="44" fill="${COLORS.success}" opacity="0.06" rx="3"/>`);
  }
  if (input.resistance1 != null && input.resistance2 != null) {
    p.push(`<rect x="${r1x.toFixed(1)}" y="${axisY - 22}" width="${(r2x - r1x).toFixed(1)}" height="44" fill="${COLORS.danger}" opacity="0.06" rx="3"/>`);
  }

  // Axis line with gradient
  p.push(`<line x1="${padL}" y1="${axisY}" x2="${width - padR}" y2="${axisY}" stroke="${COLORS.gridDark}" stroke-width="1.5"/>`);

  const mark = (v: number | undefined, label: string, color: string, above: boolean): void => {
    if (v == null) return;
    const x = xScale(v);
    const pinLen = above ? -32 : 32;
    const y2 = axisY + pinLen;
    const lblY = above ? y2 - 6 : y2 + 14;

    p.push(`<line x1="${x.toFixed(1)}" y1="${axisY}" x2="${x.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="1.5" stroke-dasharray="3,2"/>`);
    p.push(`<circle cx="${x.toFixed(1)}" cy="${axisY}" r="5" fill="${COLORS.bg}" stroke="${color}" stroke-width="2"/>`);
    p.push(`<circle cx="${x.toFixed(1)}" cy="${axisY}" r="2" fill="${color}"/>`);
    p.push(`<text x="${x.toFixed(1)}" y="${lblY.toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="${color}">${escapeSvg(label)}</text>`);
    p.push(`<text x="${x.toFixed(1)}" y="${(lblY + 12).toFixed(1)}" text-anchor="middle" font-size="9" fill="${COLORS.textMuted}" font-family="${FONT_MONO}">${v.toFixed(2)} TL</text>`);
  };

  mark(input.support2, 'Destek 2', COLORS.success, false);
  mark(input.support1, 'Destek 1', COLORS.success, false);
  mark(input.lastClose, 'Son Kapanış', COLORS.text, true);
  mark(input.resistance1, 'Direnç 1', COLORS.danger, true);
  mark(input.resistance2, 'Direnç 2', COLORS.danger, true);
  if (input.bearTarget) mark(input.bearTarget, 'Bear Hedef', COLORS.danger, false);
  if (input.baseTarget) mark(input.baseTarget, 'Baz Hedef', COLORS.primary, true);
  if (input.bullTarget) mark(input.bullTarget, 'Bull Hedef', COLORS.success, true);

  p.push(c.close);
  return p.join('');
}


// ─── HORIZONTAL BAR CHART ─────────────────────────────────────────

export interface HBarRow {
  label: string;
  value: number;
  color?: string;
  suffix?: string;
}

export function horizontalBarChart(rows: HBarRow[], title = ''): string {
  if (rows.length === 0) return '';

  const width = 720;
  const rowH = 36;
  const padL = 170;
  const padR = 90;
  const padT = title ? 44 : 22;
  const padB = 18;
  const height = padT + padB + rows.length * rowH;
  const plotW = width - padL - padR;
  const max = Math.max(...rows.map(r => Math.abs(r.value)), 1);

  const c = chartContainer(width, height, 'hb');
  const p: string[] = [c.open, c.defs, c.bgRect];
  if (title) p.push(chartTitle(title, width, 26));

  rows.forEach((r, i) => {
    const y = padT + i * rowH;
    const barW = (Math.abs(r.value) / max) * plotW;
    const color = r.color || COLORS.series[i % COLORS.series.length];

    // Subtle row stripe
    if (i % 2 === 0) p.push(`<rect x="${padL}" y="${y}" width="${plotW}" height="${rowH}" fill="${COLORS.bgAlt}" opacity="0.5"/>`);

    // Label
    p.push(`<text x="${padL - 12}" y="${y + rowH / 2 + 4}" text-anchor="end" font-size="10" font-weight="500" fill="${COLORS.text}">${escapeSvg(r.label)}</text>`);

    // Bar with rounded right cap
    p.push(`<rect x="${padL}" y="${y + 8}" width="${barW.toFixed(1)}" height="${rowH - 16}" fill="${color}" rx="3" opacity="0.9"/>`);

    // Value
    const valStr = `${r.value.toLocaleString('tr-TR')}${r.suffix ?? ''}`;
    p.push(`<text x="${padL + barW + 10}" y="${y + rowH / 2 + 4}" font-size="10.5" font-weight="700" fill="${COLORS.text}" font-family="${FONT_MONO}">${escapeSvg(valStr)}</text>`);
  });

  p.push(c.close);
  return p.join('');
}


// ─── STACKED AREA CHART ──────────────────────────────────────────

export interface StackedSeries {
  name: string;
  color?: string;
  values: Array<number | null>;
}

export function stackedAreaChart(xLabels: string[], series: StackedSeries[], title = ''): string {
  if (xLabels.length === 0 || series.every(s => s.values.every(v => v == null))) return '';

  const width = 860;
  const height = 360;
  const padL = 80;
  const padR = 30;
  const padT = title ? 55 : 28;
  const padB = 75;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const totals = xLabels.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
  const yMax = Math.max(...totals) * 1.12;
  if (yMax <= 0) return '';

  const xStep = plotW / Math.max(1, xLabels.length - 1);
  const xScale = (i: number) => padL + i * xStep;
  const yScale = (v: number) => padT + plotH - (v / yMax) * plotH;

  const c = chartContainer(width, height, 'sa');
  const p: string[] = [c.open, c.defs, c.bgRect];

  p.push(`<rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="${COLORS.bgAlt}" rx="2"/>`);
  if (title) p.push(chartTitle(title, width, 34));

  // Y gridlines
  for (let i = 0; i <= 5; i++) {
    const v = (yMax * i) / 5;
    const y = yScale(v);
    p.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="${i === 0 ? COLORS.gridDark : COLORS.gridLight}" stroke-width="${i === 0 ? 1 : 0.5}"/>`);
    p.push(`<text x="${padL - 10}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="10" font-weight="500" fill="${COLORS.textMuted}">${formatTick(v)}</text>`);
  }

  // Stacked areas
  const running = xLabels.map(() => 0);
  series.forEach((s, si) => {
    const color = s.color || COLORS.series[si % COLORS.series.length];
    const topPts: Array<[number, number]> = [];
    const bottomPts: Array<[number, number]> = [];

    xLabels.forEach((_, i) => {
      const val = s.values[i] ?? 0;
      const prev = running[i];
      const newTotal = prev + val;
      topPts.push([xScale(i), yScale(newTotal)]);
      bottomPts.push([xScale(i), yScale(prev)]);
      running[i] = newTotal;
    });

    let d = topPts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ');
    d += ' ' + [...bottomPts].reverse().map(pt => `L${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ');
    d += ' Z';
    p.push(`<path d="${d}" fill="${color}" opacity="0.82" stroke="${COLORS.bg}" stroke-width="0.8"/>`);
  });

  // X labels
  xLabels.forEach((lbl, i) => {
    const x = xScale(i);
    p.push(`<text x="${x.toFixed(1)}" y="${padT + plotH + 20}" text-anchor="middle" font-size="11" font-weight="600" fill="${COLORS.text}">${escapeSvg(lbl)}</text>`);
  });

  // Legend
  const lgY = height - 20;
  let lx = padL;
  series.forEach((s, si) => {
    const color = s.color || COLORS.series[si % COLORS.series.length];
    p.push(`<rect x="${lx}" y="${lgY - 8}" width="14" height="12" fill="${color}" rx="2" opacity="0.82"/>`);
    p.push(`<text x="${lx + 20}" y="${lgY + 1}" font-size="11" font-weight="600" fill="${COLORS.text}">${escapeSvg(s.name)}</text>`);
    lx += Math.max(150, s.name.length * 8 + 40);
  });

  p.push(c.close);
  return p.join('');
}


// ─── GAUGE CHART ──────────────────────────────────────────────────

export function gaugeChart(value: number, max: number, label: string, title = ''): string {
  const width = 340;
  const height = 230;
  const cx = width / 2;
  const cy = height - 50;
  const r = 95;

  const frac = Math.min(1, Math.max(0, value / max));
  const needleAngle = Math.PI + frac * Math.PI;
  const nx = cx + Math.cos(needleAngle) * (r - 10);
  const ny = cy + Math.sin(needleAngle) * (r - 10);

  const c = chartContainer(width, height, 'ga');
  const p: string[] = [c.open];

  let defs = c.defs.replace('</defs>', '');
  // Arc gradient: danger → warning → success
  defs += `
  <linearGradient id="ga_arcG" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="${COLORS.dangerLight}"/>
    <stop offset="50%" stop-color="${COLORS.accentLight}"/>
    <stop offset="100%" stop-color="${COLORS.successLight}"/>
  </linearGradient>`;
  defs += '</defs>';
  p.push(defs, c.bgRect);

  if (title) p.push(chartTitle(title, width, 24));

  // Background arc (full semicircle, thick)
  const arcBgStart = Math.PI;
  const arcBgEnd = 2 * Math.PI;
  const x1bg = cx + Math.cos(arcBgStart) * r;
  const y1bg = cy + Math.sin(arcBgStart) * r;
  const x2bg = cx + Math.cos(arcBgEnd) * r;
  const y2bg = cy + Math.sin(arcBgEnd) * r;
  p.push(`<path d="M${x1bg.toFixed(1)},${y1bg.toFixed(1)} A${r},${r} 0 0 1 ${x2bg.toFixed(1)},${y2bg.toFixed(1)}" stroke="${COLORS.gridLight}" stroke-width="26" fill="none" stroke-linecap="round"/>`);

  // Colored arc segments (3 zones: red, amber, green)
  const segColors = [COLORS.dangerLight, COLORS.accentLight, COLORS.successLight];
  for (let i = 0; i < 3; i++) {
    const a1 = Math.PI + (i / 3) * Math.PI;
    const a2 = Math.PI + ((i + 1) / 3) * Math.PI;
    const sx1 = cx + Math.cos(a1) * r;
    const sy1 = cy + Math.sin(a1) * r;
    const sx2 = cx + Math.cos(a2) * r;
    const sy2 = cy + Math.sin(a2) * r;
    p.push(`<path d="M${sx1.toFixed(1)},${sy1.toFixed(1)} A${r},${r} 0 0 1 ${sx2.toFixed(1)},${sy2.toFixed(1)}" stroke="${segColors[i]}" stroke-width="24" fill="none" stroke-linecap="butt" opacity="0.7"/>`);
  }

  // Needle (elegant triangle)
  const nAngle = needleAngle;
  const nLen = r - 12;
  const tipX = cx + Math.cos(nAngle) * nLen;
  const tipY = cy + Math.sin(nAngle) * nLen;
  const baseOff = Math.PI / 2;
  const b1x = cx + Math.cos(nAngle + baseOff) * 4;
  const b1y = cy + Math.sin(nAngle + baseOff) * 4;
  const b2x = cx + Math.cos(nAngle - baseOff) * 4;
  const b2y = cy + Math.sin(nAngle - baseOff) * 4;
  p.push(`<polygon points="${tipX.toFixed(1)},${tipY.toFixed(1)} ${b1x.toFixed(1)},${b1y.toFixed(1)} ${b2x.toFixed(1)},${b2y.toFixed(1)}" fill="${COLORS.text}"/>`);
  p.push(`<circle cx="${cx}" cy="${cy}" r="7" fill="${COLORS.text}"/>`);
  p.push(`<circle cx="${cx}" cy="${cy}" r="3.5" fill="${COLORS.bg}"/>`);

  // Value + label
  const valColor = frac >= 0.66 ? COLORS.success : frac >= 0.33 ? COLORS.accent : COLORS.danger;
  p.push(`<text x="${cx}" y="${cy + 32}" text-anchor="middle" font-size="26" font-weight="800" fill="${valColor}" font-family="${FONT_MONO}">${value.toFixed(2)}</text>`);
  p.push(`<text x="${cx}" y="${cy + 50}" text-anchor="middle" font-size="10" font-weight="500" fill="${COLORS.textMuted}">${escapeSvg(label)}</text>`);

  // Scale labels
  [0, max / 4, max / 2, (max * 3) / 4, max].forEach((v) => {
    const a = Math.PI + (v / max) * Math.PI;
    const rOut = r + 18;
    const xL = cx + Math.cos(a) * rOut;
    const yL = cy + Math.sin(a) * rOut;
    p.push(`<text x="${xL.toFixed(1)}" y="${(yL + 3).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="600" fill="${COLORS.textMuted}" font-family="${FONT_MONO}">${v.toFixed(v === max || v === 0 ? 0 : 2)}</text>`);
  });

  p.push(c.close);
  return p.join('');
}


// ─── COLUMN CHART ─────────────────────────────────────────────────

export interface ColumnRow {
  label: string;
  value: number;
  color?: string;
}

export function columnChart(rows: ColumnRow[], title = '', suffix = ''): string {
  if (rows.length === 0) return '';

  const width = 860;
  const height = 360;
  const padL = 75;
  const padR = 30;
  const padT = title ? 55 : 28;
  const padB = 80;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const vals = rows.map(r => r.value);
  const yMax = Math.max(...vals, 0) * 1.18;
  const yMin = Math.min(...vals, 0);
  if (yMax - yMin <= 0) return '';

  const yScale = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const colW = plotW / rows.length * 0.65;
  const colStep = plotW / rows.length;

  const c = chartContainer(width, height, 'cc');
  const p: string[] = [c.open];

  let defs = c.defs.replace('</defs>', '');
  defs += `
  <linearGradient id="cc_posG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${COLORS.primaryLight}"/><stop offset="100%" stop-color="${COLORS.primary}"/>
  </linearGradient>
  <linearGradient id="cc_negG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${COLORS.dangerLight}"/><stop offset="100%" stop-color="${COLORS.danger}"/>
  </linearGradient>`;
  defs += '</defs>';
  p.push(defs, c.bgRect);

  p.push(`<rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="${COLORS.bgAlt}" rx="2"/>`);
  if (title) p.push(chartTitle(title, width, 34));

  // Y gridlines
  for (let i = 0; i <= 5; i++) {
    const v = yMin + (yMax - yMin) * (i / 5);
    const y = yScale(v);
    p.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="${i === 0 ? COLORS.gridDark : COLORS.gridLight}" stroke-width="${i === 0 ? 1 : 0.5}"/>`);
    p.push(`<text x="${padL - 10}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="10" font-weight="500" fill="${COLORS.textMuted}">${formatTick(v)}</text>`);
  }

  // Zero line if needed
  if (yMin < 0) {
    const zeroY = yScale(0);
    p.push(`<line x1="${padL}" y1="${zeroY.toFixed(1)}" x2="${width - padR}" y2="${zeroY.toFixed(1)}" stroke="${COLORS.gridDark}" stroke-width="1"/>`);
  }

  rows.forEach((r, i) => {
    const cx = padL + i * colStep + colStep / 2;
    const cy = yScale(r.value);
    const baseY = yScale(0);
    const h = Math.abs(baseY - cy);
    const y = Math.min(cy, baseY);
    const gradId = r.value >= 0 ? 'url(#cc_posG)' : 'url(#cc_negG)';
    const color = r.color || (r.value >= 0 ? COLORS.primary : COLORS.danger);

    p.push(`<rect x="${(cx - colW / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${colW.toFixed(1)}" height="${h.toFixed(1)}" fill="${r.color ? color : gradId}" rx="3"/>`);

    // Value label
    const lblY = r.value >= 0 ? y - 8 : y + h + 14;
    p.push(`<text x="${cx.toFixed(1)}" y="${lblY.toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="${color}" font-family="${FONT_MONO}">${r.value.toLocaleString('tr-TR')}${suffix}</text>`);

    // X label
    p.push(`<text x="${cx.toFixed(1)}" y="${padT + plotH + 20}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${COLORS.text}">${escapeSvg(r.label)}</text>`);
  });

  p.push(c.close);
  return p.join('');
}


// ─── WATERFALL CHART (NEW) ────────────────────────────────────────

export interface WaterfallItem {
  label: string;
  value: number;
  isTotal?: boolean;     // renders from zero (totals)
}

export function waterfallChart(items: WaterfallItem[], title = ''): string {
  if (items.length === 0) return '';

  const width = 900;
  const height = 400;
  const padL = 85;
  const padR = 30;
  const padT = title ? 55 : 28;
  const padB = 85;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // Compute running cumulative
  let cum = 0;
  const bars = items.map(item => {
    if (item.isTotal) {
      const b = { label: item.label, start: 0, end: cum, value: cum, isTotal: true };
      return b;
    }
    const start = cum;
    cum += item.value;
    return { label: item.label, start, end: cum, value: item.value, isTotal: false };
  });

  const allYs = bars.flatMap(b => [b.start, b.end]);
  const yMin = Math.min(0, ...allYs);
  const yMax = Math.max(...allYs) * 1.15;
  if (yMax - yMin <= 0) return '';

  const yScale = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const colStep = plotW / bars.length;
  const colW = colStep * 0.6;

  const c = chartContainer(width, height, 'wf');
  const p: string[] = [c.open, c.defs, c.bgRect];

  p.push(`<rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="${COLORS.bgAlt}" rx="2"/>`);
  if (title) p.push(chartTitle(title, width, 34));

  // Y gridlines
  for (let i = 0; i <= 5; i++) {
    const v = yMin + (yMax - yMin) * (i / 5);
    const y = yScale(v);
    p.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="${COLORS.gridLight}" stroke-width="0.5"/>`);
    p.push(`<text x="${padL - 10}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="10" fill="${COLORS.textMuted}">${formatTick(v)}</text>`);
  }

  bars.forEach((b, i) => {
    const cx = padL + i * colStep + colStep / 2;
    const yTop = yScale(Math.max(b.start, b.end));
    const yBot = yScale(Math.min(b.start, b.end));
    const h = Math.max(1, yBot - yTop);
    const color = b.isTotal ? COLORS.primary : b.value >= 0 ? COLORS.success : COLORS.danger;

    p.push(`<rect x="${(cx - colW / 2).toFixed(1)}" y="${yTop.toFixed(1)}" width="${colW.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" rx="2" opacity="0.85"/>`);

    // Connector line to next bar
    if (i < bars.length - 1 && !b.isTotal) {
      const nextCx = padL + (i + 1) * colStep + colStep / 2;
      const connY = yScale(b.end);
      p.push(`<line x1="${(cx + colW / 2).toFixed(1)}" y1="${connY.toFixed(1)}" x2="${(nextCx - colW / 2).toFixed(1)}" y2="${connY.toFixed(1)}" stroke="${COLORS.gridDark}" stroke-width="0.8" stroke-dasharray="3,2"/>`);
    }

    // Value label
    const lblY = b.value >= 0 ? yTop - 7 : yBot + 14;
    const prefix = !b.isTotal && b.value > 0 ? '+' : '';
    p.push(`<text x="${cx.toFixed(1)}" y="${lblY.toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${color}" font-family="${FONT_MONO}">${prefix}${formatTick(b.value)}</text>`);

    // X label
    const lbl = b.label.length > 12 ? b.label.slice(0, 12) + '…' : b.label;
    p.push(`<text x="${cx.toFixed(1)}" y="${padT + plotH + 18}" text-anchor="middle" font-size="9.5" font-weight="600" fill="${COLORS.text}">${escapeSvg(lbl)}</text>`);
  });

  p.push(c.close);
  return p.join('');
}


// ─── SPARKLINE (NEW) ──────────────────────────────────────────────

export function sparkline(values: Array<number | null>, opts: {
  width?: number; height?: number; color?: string; showDot?: boolean;
} = {}): string {
  const valid = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (valid.length < 2) return '';

  const w = opts.width ?? 120;
  const h = opts.height ?? 32;
  const color = opts.color ?? COLORS.primary;
  const pad = 4;

  const yMin = Math.min(...valid);
  const yMax = Math.max(...valid);
  const yRange = yMax - yMin || 1;
  const xStep = (w - pad * 2) / (values.length - 1);

  let path = '';
  let lastPt: [number, number] | null = null;
  values.forEach((v, i) => {
    if (v == null) return;
    const x = pad + i * xStep;
    const y = h - pad - ((v - yMin) / yRange) * (h - pad * 2);
    path += `${lastPt ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
    lastPt = [x, y];
  });

  const parts: string[] = [];
  parts.push(`<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;width:${w}px;height:${h}px">`);
  parts.push(`<path d="${path.trim()}" stroke="${color}" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`);
  if (opts.showDot !== false && lastPt != null) {
    const lp = lastPt as [number, number];
    parts.push(`<circle cx="${lp[0].toFixed(1)}" cy="${lp[1].toFixed(1)}" r="2.5" fill="${color}"/>`);
  }
  parts.push('</svg>');
  return parts.join('');
}


// ─── MINI KPI CARD (NEW) ─────────────────────────────────────────

export interface KpiItem {
  label: string;
  value: string;
  change?: string;          // "+12.3%" or "-5.1%"
  changePositive?: boolean;
  sparkValues?: Array<number | null>;
}

export function kpiStrip(items: KpiItem[]): string {
  if (items.length === 0) return '';

  const cardW = 195;
  const cardH = 80;
  const gap = 12;
  const width = items.length * cardW + (items.length - 1) * gap;
  const height = cardH;

  const parts: string[] = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:${width}px;height:auto;font-family:${FONT}">`);

  items.forEach((item, i) => {
    const x = i * (cardW + gap);

    // Card background
    parts.push(`<rect x="${x}" y="0" width="${cardW}" height="${cardH}" fill="${COLORS.bg}" stroke="${COLORS.grid}" stroke-width="0.8" rx="8"/>`);

    // Label
    parts.push(`<text x="${x + 14}" y="22" font-size="9.5" font-weight="500" fill="${COLORS.textMuted}">${escapeSvg(item.label)}</text>`);

    // Value
    parts.push(`<text x="${x + 14}" y="48" font-size="20" font-weight="800" fill="${COLORS.text}" font-family="${FONT_MONO}">${escapeSvg(item.value)}</text>`);

    // Change badge
    if (item.change) {
      const bgColor = item.changePositive ? COLORS.success : COLORS.danger;
      const textColor = '#ffffff';
      const changeW = item.change.length * 6.5 + 12;
      parts.push(`<rect x="${x + 14}" y="${cardH - 22}" width="${changeW}" height="16" fill="${bgColor}" rx="8" opacity="0.9"/>`);
      parts.push(`<text x="${x + 14 + changeW / 2}" y="${cardH - 10}" text-anchor="middle" font-size="8.5" font-weight="700" fill="${textColor}" font-family="${FONT_MONO}">${escapeSvg(item.change)}</text>`);
    }

    // Sparkline (inline)
    if (item.sparkValues && item.sparkValues.length >= 2) {
      const sparkW = 55;
      const sparkH = 28;
      const sx = x + cardW - sparkW - 10;
      const sy = (cardH - sparkH) / 2;
      const sparkValid = item.sparkValues.filter((v): v is number => v != null);
      if (sparkValid.length >= 2) {
        const yMinS = Math.min(...sparkValid);
        const yMaxS = Math.max(...sparkValid);
        const yR = yMaxS - yMinS || 1;
        const xStepS = (sparkW - 4) / (item.sparkValues.length - 1);
        let sparkPath = '';
        let pen = false;
        item.sparkValues.forEach((v, j) => {
          if (v == null) { pen = false; return; }
          const px = sx + 2 + j * xStepS;
          const py = sy + sparkH - 2 - ((v - yMinS) / yR) * (sparkH - 4);
          sparkPath += `${pen ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)} `;
          pen = true;
        });
        const sparkColor = item.changePositive !== false ? COLORS.success : COLORS.danger;
        parts.push(`<path d="${sparkPath.trim()}" stroke="${sparkColor}" stroke-width="1.5" fill="none" stroke-linejoin="round" opacity="0.6"/>`);
      }
    }
  });

  parts.push('</svg>');
  return parts.join('');
}
