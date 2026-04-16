/**
 * Inline SVG chart generators — zero dependencies.
 *
 * Produces compact, print-safe SVG strings that embed directly in
 * the HTML template. Every function returns '' when data is
 * insufficient so the template's {{#if}} guards hide the block.
 *
 * Four chart types covered:
 *   - lineChart     5-year trend (revenue / EBITDA / net income)
 *   - barChart      sector benchmark comparison (peer vs company)
 *   - pieChart      ownership / segment distribution
 *   - timelineChart KAP event timeline (horizontal)
 */

const COLORS = {
  primary: '#1e40af',
  primaryDark: '#1e3a8a',
  primaryLight: '#60a5fa',
  accent: '#f59e0b',
  accentDark: '#d97706',
  success: '#059669',
  successDark: '#047857',
  danger: '#dc2626',
  dangerDark: '#b91c1c',
  warning: '#d97706',
  muted: '#94a3b8',
  mutedLight: '#cbd5e1',
  grid: '#e2e8f0',
  gridLight: '#f1f5f9',
  text: '#0f172a',
  textMuted: '#64748b',
  bg: '#ffffff',
  bgAlt: '#f8fafc',
};


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


/** Multi-series line chart for 5-year trends.
 *  series: [{ name, color, values: [y1, y2, ...] }]
 *  xLabels: ['2021', '2022', ...]
 */
export interface LineSeries {
  name: string;
  color?: string;
  values: Array<number | null>;
}


export function lineChart(xLabels: string[], series: LineSeries[], title = ''): string {
  if (xLabels.length === 0 || series.every(s => s.values.every(v => v == null))) return '';

  const width = 860;
  const height = 360;
  const padL = 80;
  const padR = 30;
  const padT = title ? 50 : 25;
  const padB = 75;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // Y range from all non-null values
  const allVals = series.flatMap(s => s.values.filter((v): v is number => v != null && Number.isFinite(v)));
  if (allVals.length === 0) return '';
  const yMin = Math.min(...allVals, 0);
  const yMax = Math.max(...allVals);
  const yRange = yMax - yMin || 1;
  const yPadded = yRange * 0.1;
  const yLo = yMin - yPadded;
  const yHi = yMax + yPadded;

  const xStep = plotW / Math.max(1, xLabels.length - 1);
  const xScale = (i: number) => padL + i * xStep;
  const yScale = (v: number) => padT + plotH - ((v - yLo) / (yHi - yLo)) * plotH;

  const svgParts: string[] = [];
  svgParts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:${width}px;height:auto;background:${COLORS.bgAlt};border-radius:8px;font-family:-apple-system,'Segoe UI',sans-serif;">`);

  // Background panel
  svgParts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="${COLORS.bg}" rx="8"/>`);
  svgParts.push(`<rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="${COLORS.bgAlt}" stroke="${COLORS.grid}" stroke-width="1"/>`);

  if (title) svgParts.push(`<text x="${width/2}" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="${COLORS.text}">${escapeSvg(title)}</text>`);

  // Y gridlines + labels with enhanced styling
  const yTicks = 6;
  for (let i = 0; i <= yTicks; i++) {
    const v = yLo + (yHi - yLo) * (i / yTicks);
    const y = yScale(v);
    svgParts.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="${COLORS.gridLight}" stroke-width="1" stroke-dasharray="3,3"/>`);
    svgParts.push(`<text x="${padL - 10}" y="${y + 4}" text-anchor="end" font-size="11" font-weight="500" fill="${COLORS.textMuted}">${formatTick(v)}</text>`);
  }

  // X labels with tick marks
  xLabels.forEach((lbl, i) => {
    const x = xScale(i);
    svgParts.push(`<line x1="${x.toFixed(1)}" y1="${height - padB}" x2="${x.toFixed(1)}" y2="${(height - padB + 5).toFixed(1)}" stroke="${COLORS.textMuted}" stroke-width="1"/>`);
    svgParts.push(`<text x="${x.toFixed(1)}" y="${height - padB + 20}" text-anchor="middle" font-size="11" font-weight="600" fill="${COLORS.text}">${escapeSvg(lbl)}</text>`);
  });

  // X-axis line
  svgParts.push(`<line x1="${padL}" y1="${height - padB}" x2="${width - padR}" y2="${height - padB}" stroke="${COLORS.text}" stroke-width="1.5"/>`);

  // Series lines + points with shadow + gradient fill under
  const defaultColors = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.danger];
  series.forEach((s, si) => {
    const color = s.color || defaultColors[si % defaultColors.length];
    const pts = s.values.map((v, i) => v != null && Number.isFinite(v) ? [xScale(i), yScale(v)] : null);
    let path = '';
    let pen = false;
    pts.forEach(p => {
      if (p == null) { pen = false; return; }
      path += `${pen ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)} `;
      pen = true;
    });
    // Line with subtle drop shadow
    svgParts.push(`<path d="${path.trim()}" stroke="${color}" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round" opacity="0.92"/>`);
    pts.forEach(p => {
      if (p) {
        svgParts.push(`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5" fill="${COLORS.bg}" stroke="${color}" stroke-width="2.5"/>`);
      }
    });
  });

  // Legend with colored squares
  const legendY = height - 18;
  let lx = padL;
  series.forEach((s, si) => {
    const color = s.color || defaultColors[si % defaultColors.length];
    svgParts.push(`<rect x="${lx}" y="${legendY - 10}" width="14" height="14" fill="${color}" rx="2"/>`);
    svgParts.push(`<text x="${lx + 20}" y="${legendY + 1}" font-size="12" font-weight="600" fill="${COLORS.text}">${escapeSvg(s.name)}</text>`);
    lx += 160;
  });

  svgParts.push('</svg>');
  return svgParts.join('');
}


/** Bar chart — categories on X, height = value.
 *  Supports paired bars (company vs median) via `groups`. */
export interface BarGroup {
  label: string;
  companyValue: number | null;
  medianValue: number | null;
}


export function barChart(groups: BarGroup[], title = ''): string {
  if (groups.every(g => g.companyValue == null && g.medianValue == null)) return '';

  const width = 860;
  const height = 360;
  const padL = 70;
  const padR = 30;
  const padT = title ? 50 : 25;
  const padB = 85;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const allVals = groups.flatMap(g => [g.companyValue, g.medianValue].filter((v): v is number => v != null));
  if (allVals.length === 0) return '';
  const yMax = Math.max(...allVals) * 1.15;
  const yMin = Math.min(0, ...allVals);
  const yScale = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const groupW = plotW / groups.length;
  const barW = groupW * 0.35;

  const parts: string[] = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:${width}px;height:auto;background:${COLORS.bgAlt};border-radius:8px;font-family:-apple-system,'Segoe UI',sans-serif;">`);
  parts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="${COLORS.bg}" rx="8"/>`);
  parts.push(`<rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="${COLORS.bgAlt}" stroke="${COLORS.grid}" stroke-width="1"/>`);
  if (title) parts.push(`<text x="${width/2}" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="${COLORS.text}">${escapeSvg(title)}</text>`);

  // Y gridlines
  for (let i = 0; i <= 5; i++) {
    const v = yMin + (yMax - yMin) * (i / 5);
    const y = yScale(v);
    parts.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="${COLORS.gridLight}" stroke-width="1" stroke-dasharray="3,3"/>`);
    parts.push(`<text x="${padL - 10}" y="${y + 4}" text-anchor="end" font-size="11" font-weight="500" fill="${COLORS.textMuted}">${formatTick(v)}</text>`);
  }

  // X-axis line
  parts.push(`<line x1="${padL}" y1="${height - padB}" x2="${width - padR}" y2="${height - padB}" stroke="${COLORS.text}" stroke-width="1.5"/>`);

  groups.forEach((g, i) => {
    const cx = padL + i * groupW + groupW / 2;
    const x0 = cx - barW;
    const x1 = cx + 4;
    const bw = barW * 0.9;
    const y0 = g.companyValue != null ? yScale(g.companyValue) : yScale(0);
    const h0 = g.companyValue != null ? yScale(0) - y0 : 0;
    const y1 = g.medianValue != null ? yScale(g.medianValue) : yScale(0);
    const h1 = g.medianValue != null ? yScale(0) - y1 : 0;

    if (g.companyValue != null) {
      parts.push(`<rect x="${x0.toFixed(1)}" y="${Math.min(y0, yScale(0)).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.abs(h0).toFixed(1)}" fill="${COLORS.primary}" rx="3"/>`);
      parts.push(`<text x="${cx - barW / 2}" y="${y0 - 6}" text-anchor="middle" font-size="10" font-weight="700" fill="${COLORS.primary}">${formatTick(g.companyValue)}</text>`);
    }
    if (g.medianValue != null) {
      parts.push(`<rect x="${x1.toFixed(1)}" y="${Math.min(y1, yScale(0)).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.abs(h1).toFixed(1)}" fill="${COLORS.accent}" rx="3" opacity="0.85"/>`);
      parts.push(`<text x="${cx + barW / 2}" y="${y1 - 6}" text-anchor="middle" font-size="10" font-weight="700" fill="${COLORS.accent}">${formatTick(g.medianValue)}</text>`);
    }
    parts.push(`<text x="${cx}" y="${height - padB + 18}" text-anchor="middle" font-size="11" font-weight="600" fill="${COLORS.text}">${escapeSvg(g.label)}</text>`);
  });

  // Legend
  const lgY = height - 24;
  parts.push(`<rect x="${padL}" y="${lgY - 10}" width="16" height="14" fill="${COLORS.primary}" rx="2"/>`);
  parts.push(`<text x="${padL + 22}" y="${lgY + 1}" font-size="12" font-weight="600" fill="${COLORS.text}">Şirket</text>`);
  parts.push(`<rect x="${padL + 110}" y="${lgY - 10}" width="16" height="14" fill="${COLORS.accent}" rx="2" opacity="0.85"/>`);
  parts.push(`<text x="${padL + 132}" y="${lgY + 1}" font-size="12" font-weight="600" fill="${COLORS.text}">Sektör Medyanı</text>`);
  parts.push('</svg>');
  return parts.join('');
}


/** Horizontal timeline chart — events on a time axis. */
export interface TimelineEvent {
  date: string;      // ISO YYYY-MM-DD
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

  const width = 780;
  const height = 180;
  const padL = 60;
  const padR = 20;
  const padT = title ? 40 : 20;
  const padB = 40;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const yMid = padT + plotH / 2;

  const tMin = valid[0].ts;
  const tMax = valid[valid.length - 1].ts;
  const xScale = (t: number) => padL + ((t - tMin) / Math.max(1, tMax - tMin)) * plotW;

  const dirColor: Record<string, string> = {
    positive: COLORS.success,
    negative: COLORS.danger,
    neutral: COLORS.muted,
    mixed: COLORS.warning,
    uncertain: COLORS.muted,
  };

  const parts: string[] = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${width}px;height:auto">`);
  if (title) parts.push(`<text x="${width/2}" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="${COLORS.text}">${escapeSvg(title)}</text>`);

  // Axis line
  parts.push(`<line x1="${padL}" y1="${yMid}" x2="${width - padR}" y2="${yMid}" stroke="${COLORS.text}" stroke-width="1.5"/>`);

  // Month ticks
  const months = Math.max(1, Math.round((tMax - tMin) / (30 * 86400000)));
  const tickStep = Math.ceil(months / 6);
  const start = new Date(tMin);
  for (let i = 0; i <= months; i += tickStep) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const x = xScale(d.getTime());
    if (x >= padL && x <= width - padR) {
      parts.push(`<line x1="${x}" y1="${yMid - 4}" x2="${x}" y2="${yMid + 4}" stroke="${COLORS.textMuted}" stroke-width="1"/>`);
      parts.push(`<text x="${x}" y="${yMid + 18}" text-anchor="middle" font-size="9" fill="${COLORS.textMuted}">${d.toISOString().slice(0, 7)}</text>`);
    }
  }

  // Events as alternating pins
  valid.slice(0, 20).forEach((e, i) => {
    const x = xScale(e.ts);
    const above = i % 2 === 0;
    const y = above ? yMid - 25 : yMid + 25;
    const lblY = above ? y - 8 : y + 12;
    const color = dirColor[e.direction ?? 'neutral'] || COLORS.muted;
    parts.push(`<line x1="${x}" y1="${yMid}" x2="${x}" y2="${y}" stroke="${color}" stroke-width="1"/>`);
    parts.push(`<circle cx="${x}" cy="${y}" r="4" fill="${color}"/>`);
    const lblTrunc = e.label.length > 30 ? e.label.slice(0, 30) + '…' : e.label;
    parts.push(`<text x="${x}" y="${lblY}" text-anchor="middle" font-size="8" fill="${COLORS.text}">${escapeSvg(lblTrunc)}</text>`);
  });

  parts.push('</svg>');
  return parts.join('');
}


/** Donut/pie chart for ownership or segment distribution.
 *  slices: [{ label, value, color? }] */
export interface PieSlice {
  label: string;
  value: number;
  color?: string;
}


export function pieChart(slices: PieSlice[], title = ''): string {
  const filtered = slices.filter(s => s.value > 0);
  if (filtered.length === 0) return '';

  const width = 620;
  const height = 360;
  const cx = 180;
  const cy = height / 2 + (title ? 10 : 0);
  const r = 130;
  const innerR = 55;       // donut hole
  const total = filtered.reduce((a, s) => a + s.value, 0);

  const defaultColors = [
    COLORS.primary, COLORS.accent, COLORS.success, COLORS.danger,
    '#7c3aed', '#0891b2', '#be123c', '#0f766e',
  ];

  let angleStart = -Math.PI / 2;
  const parts: string[] = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:${width}px;height:auto;background:${COLORS.bgAlt};border-radius:8px;font-family:-apple-system,'Segoe UI',sans-serif;">`);
  parts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="${COLORS.bg}" rx="8"/>`);
  if (title) parts.push(`<text x="${width/2}" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="${COLORS.text}">${escapeSvg(title)}</text>`);

  filtered.forEach((s, i) => {
    const frac = s.value / total;
    const angleEnd = angleStart + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const x1Out = cx + Math.cos(angleStart) * r;
    const y1Out = cy + Math.sin(angleStart) * r;
    const x2Out = cx + Math.cos(angleEnd) * r;
    const y2Out = cy + Math.sin(angleEnd) * r;
    const x1In = cx + Math.cos(angleEnd) * innerR;
    const y1In = cy + Math.sin(angleEnd) * innerR;
    const x2In = cx + Math.cos(angleStart) * innerR;
    const y2In = cy + Math.sin(angleStart) * innerR;
    const color = s.color || defaultColors[i % defaultColors.length];

    // Donut slice: outer arc → inner arc reverse
    parts.push(`<path d="M${x1Out.toFixed(1)},${y1Out.toFixed(1)} A${r},${r} 0 ${large} 1 ${x2Out.toFixed(1)},${y2Out.toFixed(1)} L${x1In.toFixed(1)},${y1In.toFixed(1)} A${innerR},${innerR} 0 ${large} 0 ${x2In.toFixed(1)},${y2In.toFixed(1)} Z" fill="${color}" stroke="${COLORS.bg}" stroke-width="2"/>`);

    // Label inside/near slice if slice >= 5%
    if (frac >= 0.05) {
      const midAngle = (angleStart + angleEnd) / 2;
      const lblR = (r + innerR) / 2;
      const lx = cx + Math.cos(midAngle) * lblR;
      const ly = cy + Math.sin(midAngle) * lblR;
      parts.push(`<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="white">${(frac * 100).toFixed(1)}%</text>`);
    }

    // Legend on right side
    const lgY = 60 + i * 28;
    parts.push(`<rect x="360" y="${lgY}" width="18" height="18" fill="${color}" rx="3"/>`);
    parts.push(`<text x="385" y="${lgY + 13}" font-size="12" fill="${COLORS.text}">${escapeSvg(s.label)}</text>`);
    parts.push(`<text x="${width - 20}" y="${lgY + 13}" text-anchor="end" font-size="12" font-weight="700" fill="${COLORS.textMuted}">${(frac * 100).toFixed(1)}%</text>`);

    angleStart = angleEnd;
  });

  // Center label
  parts.push(`<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="11" font-weight="600" fill="${COLORS.textMuted}">Toplam</text>`);
  parts.push(`<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="14" font-weight="700" fill="${COLORS.text}">%100</text>`);

  parts.push('</svg>');
  return parts.join('');
}


/** Radar chart (spider web) — n dimensions with 0-100 scale. */
export interface RadarAxis {
  label: string;
  value: number;             // 0-100
}


export function radarChart(axes: RadarAxis[], title = ''): string {
  if (axes.length < 3) return '';

  const width = 440;
  const height = 340;
  const cx = width / 2;
  const cy = height / 2 + (title ? 10 : 0);
  const r = 110;
  const n = axes.length;
  const angleStep = (Math.PI * 2) / n;

  const parts: string[] = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${width}px;height:auto">`);
  if (title) parts.push(`<text x="${cx}" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="${COLORS.text}">${escapeSvg(title)}</text>`);

  // Grid circles (25/50/75/100)
  [25, 50, 75, 100].forEach(level => {
    const rr = (r * level) / 100;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + i * angleStep;
      return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
    }).join(' ');
    parts.push(`<polygon points="${pts}" fill="none" stroke="${COLORS.grid}" stroke-width="0.5"/>`);
  });

  // Axis lines + labels
  axes.forEach((ax, i) => {
    const a = -Math.PI / 2 + i * angleStep;
    const x2 = cx + Math.cos(a) * r;
    const y2 = cy + Math.sin(a) * r;
    parts.push(`<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${COLORS.grid}" stroke-width="0.5"/>`);
    const labelX = cx + Math.cos(a) * (r + 20);
    const labelY = cy + Math.sin(a) * (r + 20);
    parts.push(`<text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" font-size="10" font-weight="600" fill="${COLORS.text}">${escapeSvg(ax.label)}</text>`);
  });

  // Data polygon
  const dataPts = axes.map((ax, i) => {
    const a = -Math.PI / 2 + i * angleStep;
    const rr = (r * Math.min(100, Math.max(0, ax.value))) / 100;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }).join(' ');
  parts.push(`<polygon points="${dataPts}" fill="${COLORS.primary}" fill-opacity="0.25" stroke="${COLORS.primary}" stroke-width="2"/>`);

  // Data points
  axes.forEach((ax, i) => {
    const a = -Math.PI / 2 + i * angleStep;
    const rr = (r * Math.min(100, Math.max(0, ax.value))) / 100;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${COLORS.primary}"/>`);
    parts.push(`<text x="${x.toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="600" fill="${COLORS.primary}">${ax.value.toFixed(0)}</text>`);
  });

  parts.push('</svg>');
  return parts.join('');
}


/** Price band chart — horizontal current/support/resistance layout. */
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

  const width = 780;
  const height = 180;
  const padL = 40;
  const padR = 40;
  const padT = title ? 40 : 20;
  const padB = 40;
  const plotW = width - padL - padR;
  const axisY = padT + (height - padT - padB) / 2;

  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const xScale = (v: number) => padL + ((v - min) / (max - min)) * plotW;

  const parts: string[] = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${width}px;height:auto">`);
  if (title) parts.push(`<text x="${width/2}" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="${COLORS.text}">${escapeSvg(title)}</text>`);

  // Axis line
  parts.push(`<line x1="${padL}" y1="${axisY}" x2="${width - padR}" y2="${axisY}" stroke="${COLORS.text}" stroke-width="1"/>`);

  const mark = (v: number | undefined, label: string, color: string, above: boolean): void => {
    if (v == null) return;
    const x = xScale(v);
    const tickY1 = above ? axisY - 6 : axisY + 6;
    const tickY2 = above ? axisY - 30 : axisY + 30;
    parts.push(`<line x1="${x.toFixed(1)}" y1="${axisY}" x2="${x.toFixed(1)}" y2="${tickY2}" stroke="${color}" stroke-width="1.5"/>`);
    parts.push(`<circle cx="${x.toFixed(1)}" cy="${axisY}" r="4" fill="${color}"/>`);
    const lblY = above ? tickY2 - 6 : tickY2 + 12;
    parts.push(`<text x="${x.toFixed(1)}" y="${lblY}" text-anchor="middle" font-size="9" font-weight="600" fill="${color}">${escapeSvg(label)}</text>`);
    parts.push(`<text x="${x.toFixed(1)}" y="${lblY + 11}" text-anchor="middle" font-size="9" fill="${COLORS.textMuted}">${v.toFixed(2)} TL</text>`);
    void tickY1;
  };

  mark(input.support2, 'S2', COLORS.success, false);
  mark(input.support1, 'S1', COLORS.success, false);
  mark(input.lastClose, 'Son Kapanış', COLORS.text, true);
  mark(input.resistance1, 'R1', COLORS.danger, true);
  mark(input.resistance2, 'R2', COLORS.danger, true);
  if (input.bearTarget) mark(input.bearTarget, 'Bear', COLORS.danger, false);
  if (input.baseTarget) mark(input.baseTarget, 'Base', COLORS.primary, true);
  if (input.bullTarget) mark(input.bullTarget, 'Bull', COLORS.success, true);

  parts.push('</svg>');
  return parts.join('');
}


/** Horizontal bar chart — per-row comparison (e.g. segment income).
 *  Good for ownership %, segment revenue share, category contrib. */
export interface HBarRow {
  label: string;
  value: number;
  color?: string;
  suffix?: string;
}


export function horizontalBarChart(rows: HBarRow[], title = ''): string {
  if (rows.length === 0) return '';

  const width = 700;
  const rowHeight = 32;
  const padL = 160;
  const padR = 80;
  const padT = title ? 40 : 20;
  const padB = 20;
  const height = padT + padB + rows.length * rowHeight;
  const plotW = width - padL - padR;
  const max = Math.max(...rows.map(r => r.value), 1);

  const parts: string[] = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${width}px;height:auto">`);
  if (title) parts.push(`<text x="${width/2}" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="${COLORS.text}">${escapeSvg(title)}</text>`);

  const defaultColors = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.warning, '#7c3aed', '#0891b2'];
  rows.forEach((r, i) => {
    const y = padT + i * rowHeight;
    const barW = (r.value / max) * plotW;
    const color = r.color || defaultColors[i % defaultColors.length];
    parts.push(`<text x="${padL - 8}" y="${y + rowHeight / 2 + 4}" text-anchor="end" font-size="10" fill="${COLORS.text}">${escapeSvg(r.label)}</text>`);
    parts.push(`<rect x="${padL}" y="${y + 6}" width="${barW.toFixed(1)}" height="${rowHeight - 12}" fill="${color}" rx="3"/>`);
    const valStr = `${r.value.toLocaleString('tr-TR')}${r.suffix ?? ''}`;
    parts.push(`<text x="${padL + barW + 8}" y="${y + rowHeight / 2 + 4}" font-size="10" font-weight="600" fill="${COLORS.text}">${escapeSvg(valStr)}</text>`);
  });

  parts.push('</svg>');
  return parts.join('');
}


/** Stacked area chart — multi-series, cumulative over X.
 *  Good for revenue composition, segment contribution trend. */
export interface StackedSeries {
  name: string;
  color?: string;
  values: Array<number | null>;
}


export function stackedAreaChart(xLabels: string[], series: StackedSeries[], title = ''): string {
  if (xLabels.length === 0 || series.every(s => s.values.every(v => v == null))) return '';

  const width = 860;
  const height = 340;
  const padL = 80;
  const padR = 30;
  const padT = title ? 50 : 25;
  const padB = 75;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // Compute stacked totals to find max
  const totals = xLabels.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
  const yMax = Math.max(...totals) * 1.1;
  if (yMax <= 0) return '';

  const xStep = plotW / Math.max(1, xLabels.length - 1);
  const xScale = (i: number) => padL + i * xStep;
  const yScale = (v: number) => padT + plotH - (v / yMax) * plotH;

  const defaultColors = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.danger, COLORS.warning, '#7c3aed'];
  const parts: string[] = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:${width}px;height:auto;background:${COLORS.bgAlt};border-radius:8px;font-family:-apple-system,'Segoe UI',sans-serif;">`);
  parts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="${COLORS.bg}" rx="8"/>`);
  parts.push(`<rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="${COLORS.bgAlt}" stroke="${COLORS.grid}" stroke-width="1"/>`);
  if (title) parts.push(`<text x="${width/2}" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="${COLORS.text}">${escapeSvg(title)}</text>`);

  // Y gridlines
  for (let i = 0; i <= 5; i++) {
    const v = (yMax * i) / 5;
    const y = yScale(v);
    parts.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="${COLORS.gridLight}" stroke-width="1" stroke-dasharray="3,3"/>`);
    parts.push(`<text x="${padL - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="${COLORS.textMuted}">${formatTick(v)}</text>`);
  }

  // Stacked areas
  const running = xLabels.map(() => 0);
  series.forEach((s, si) => {
    const color = s.color || defaultColors[si % defaultColors.length];
    let bottomPath = '';
    let topPath = '';
    xLabels.forEach((_, i) => {
      const val = s.values[i] ?? 0;
      const newTotal = running[i] + val;
      const xT = xScale(i);
      const yBottom = yScale(running[i]);
      const yTop = yScale(newTotal);
      bottomPath += `${i === 0 ? 'M' : 'L'}${xT.toFixed(1)},${yBottom.toFixed(1)} `;
      topPath += `${i === 0 ? 'M' : 'L'}${xT.toFixed(1)},${yTop.toFixed(1)} `;
      running[i] = newTotal;
    });
    // Close path: top (left→right), bottom (right→left)
    const reverseBottom = xLabels.map((_, i) => {
      const j = xLabels.length - 1 - i;
      const val = s.values[j] ?? 0;
      const prev = running[j] - val;
      return `L${xScale(j).toFixed(1)},${yScale(prev).toFixed(1)}`;
    }).join(' ');
    const d = topPath.trim() + ' ' + reverseBottom + ' Z';
    parts.push(`<path d="${d}" fill="${color}" opacity="0.85" stroke="${COLORS.bg}" stroke-width="1"/>`);
  });

  // X labels
  xLabels.forEach((lbl, i) => {
    const x = xScale(i);
    parts.push(`<text x="${x.toFixed(1)}" y="${height - padB + 20}" text-anchor="middle" font-size="11" font-weight="600" fill="${COLORS.text}">${escapeSvg(lbl)}</text>`);
  });

  // Legend
  const lgY = height - 18;
  let lx = padL;
  series.forEach((s, si) => {
    const color = s.color || defaultColors[si % defaultColors.length];
    parts.push(`<rect x="${lx}" y="${lgY - 10}" width="14" height="14" fill="${color}" rx="2"/>`);
    parts.push(`<text x="${lx + 20}" y="${lgY + 1}" font-size="12" font-weight="600" fill="${COLORS.text}">${escapeSvg(s.name)}</text>`);
    lx += 170;
  });

  parts.push('</svg>');
  return parts.join('');
}


/** Gauge meter chart — single value 0-max with needle. Good for
 *  scores (QA, sentiment, risk level). */
export function gaugeChart(value: number, max: number, label: string, title = ''): string {
  const width = 320;
  const height = 210;
  const cx = width / 2;
  const cy = height - 40;
  const r = 90;

  const frac = Math.min(1, Math.max(0, value / max));
  const angle = Math.PI + frac * Math.PI; // 180° → 360°

  const x2 = cx + Math.cos(angle) * r;
  const y2 = cy + Math.sin(angle) * r;

  const parts: string[] = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:${width}px;height:auto;background:${COLORS.bg};border-radius:8px;font-family:-apple-system,'Segoe UI',sans-serif;">`);
  if (title) parts.push(`<text x="${cx}" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="${COLORS.text}">${escapeSvg(title)}</text>`);

  // Gauge arc background (red→yellow→green)
  const arcStart = Math.PI;
  const arcEnd = 2 * Math.PI;
  const segments = 3;
  const colors = [COLORS.danger, COLORS.accent, COLORS.success];
  for (let i = 0; i < segments; i++) {
    const a1 = arcStart + (i / segments) * (arcEnd - arcStart);
    const a2 = arcStart + ((i + 1) / segments) * (arcEnd - arcStart);
    const x1 = cx + Math.cos(a1) * r;
    const y1 = cy + Math.sin(a1) * r;
    const x2a = cx + Math.cos(a2) * r;
    const y2a = cy + Math.sin(a2) * r;
    parts.push(`<path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 0 1 ${x2a.toFixed(1)},${y2a.toFixed(1)}" stroke="${colors[i]}" stroke-width="22" fill="none" stroke-linecap="butt" opacity="0.85"/>`);
  }

  // Needle
  parts.push(`<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${COLORS.text}" stroke-width="3" stroke-linecap="round"/>`);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="8" fill="${COLORS.text}"/>`);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="${COLORS.bg}"/>`);

  // Value + label
  parts.push(`<text x="${cx}" y="${cy + 35}" text-anchor="middle" font-size="24" font-weight="800" fill="${COLORS.text}" font-family="ui-monospace, Consolas, monospace">${value.toFixed(2)}</text>`);
  parts.push(`<text x="${cx}" y="${cy + 55}" text-anchor="middle" font-size="11" font-weight="500" fill="${COLORS.textMuted}">${escapeSvg(label)}</text>`);

  // Scale
  [0, max / 2, max].forEach((v, i) => {
    const a = arcStart + (v / max) * (arcEnd - arcStart);
    const rOut = r + 18;
    const xL = cx + Math.cos(a) * rOut;
    const yL = cy + Math.sin(a) * rOut;
    parts.push(`<text x="${xL.toFixed(1)}" y="${(yL + 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="600" fill="${COLORS.textMuted}">${v.toFixed(0)}</text>`);
    void i;
  });

  parts.push('</svg>');
  return parts.join('');
}


/** Column chart — labeled vertical bars (single series). Good for
 *  year-on-year comparisons. */
export interface ColumnRow {
  label: string;
  value: number;
  color?: string;
}


export function columnChart(rows: ColumnRow[], title = '', suffix = ''): string {
  if (rows.length === 0) return '';

  const width = 860;
  const height = 340;
  const padL = 70;
  const padR = 30;
  const padT = title ? 50 : 25;
  const padB = 85;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const vals = rows.map(r => r.value);
  const yMax = Math.max(...vals, 0) * 1.15;
  const yMin = Math.min(...vals, 0);
  if (yMax - yMin <= 0) return '';

  const yScale = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const colW = plotW / rows.length * 0.7;
  const colStep = plotW / rows.length;

  const parts: string[] = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:${width}px;height:auto;background:${COLORS.bgAlt};border-radius:8px;font-family:-apple-system,'Segoe UI',sans-serif;">`);
  parts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="${COLORS.bg}" rx="8"/>`);
  parts.push(`<rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="${COLORS.bgAlt}" stroke="${COLORS.grid}" stroke-width="1"/>`);
  if (title) parts.push(`<text x="${width/2}" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="${COLORS.text}">${escapeSvg(title)}</text>`);

  // Y gridlines
  for (let i = 0; i <= 5; i++) {
    const v = yMin + (yMax - yMin) * (i / 5);
    const y = yScale(v);
    parts.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="${COLORS.gridLight}" stroke-width="1" stroke-dasharray="3,3"/>`);
    parts.push(`<text x="${padL - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="${COLORS.textMuted}">${formatTick(v)}</text>`);
  }

  // Columns
  rows.forEach((r, i) => {
    const cx = padL + i * colStep + colStep / 2;
    const cy = yScale(r.value);
    const baseY = yScale(0);
    const h = Math.abs(baseY - cy);
    const y = Math.min(cy, baseY);
    const color = r.color || (r.value >= 0 ? COLORS.primary : COLORS.danger);
    parts.push(`<rect x="${(cx - colW / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${colW.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" rx="4"/>`);
    // Value label
    const lblY = r.value >= 0 ? y - 8 : y + h + 14;
    parts.push(`<text x="${cx.toFixed(1)}" y="${lblY.toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="${color}">${r.value.toLocaleString('tr-TR')}${suffix}</text>`);
    // X label
    parts.push(`<text x="${cx.toFixed(1)}" y="${height - padB + 20}" text-anchor="middle" font-size="11" font-weight="600" fill="${COLORS.text}">${escapeSvg(r.label)}</text>`);
  });

  parts.push('</svg>');
  return parts.join('');
}


function escapeSvg(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
