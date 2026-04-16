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
  accent: '#f59e0b',
  success: '#059669',
  danger: '#dc2626',
  warning: '#d97706',
  muted: '#94a3b8',
  grid: '#e5e7eb',
  text: '#1e293b',
  textMuted: '#6b7280',
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

  const width = 780;
  const height = 280;
  const padL = 70;
  const padR = 20;
  const padT = title ? 40 : 20;
  const padB = 60;
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
  svgParts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${width}px;height:auto;font-family:var(--font-main, sans-serif)">`);
  if (title) svgParts.push(`<text x="${width/2}" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="${COLORS.text}">${escapeSvg(title)}</text>`);

  // Y gridlines + labels
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const v = yLo + (yHi - yLo) * (i / yTicks);
    const y = yScale(v);
    svgParts.push(`<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="${COLORS.grid}" stroke-width="0.5"/>`);
    svgParts.push(`<text x="${padL - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="${COLORS.textMuted}">${formatTick(v)}</text>`);
  }

  // X labels
  xLabels.forEach((lbl, i) => {
    const x = xScale(i);
    svgParts.push(`<text x="${x}" y="${height - padB + 15}" text-anchor="middle" font-size="9" fill="${COLORS.textMuted}">${escapeSvg(lbl)}</text>`);
  });

  // Series lines + points
  const defaultColors = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.danger];
  series.forEach((s, si) => {
    const color = s.color || defaultColors[si % defaultColors.length];
    const pts = s.values.map((v, i) => v != null && Number.isFinite(v) ? [xScale(i), yScale(v)] : null);
    // Build path breaking at null segments
    let path = '';
    let pen = false;
    pts.forEach(p => {
      if (p == null) { pen = false; return; }
      path += `${pen ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)} `;
      pen = true;
    });
    svgParts.push(`<path d="${path.trim()}" stroke="${color}" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`);
    pts.forEach(p => {
      if (p) svgParts.push(`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="${color}"/>`);
    });
  });

  // Legend
  const legendY = height - 20;
  let lx = padL;
  series.forEach((s, si) => {
    const color = s.color || defaultColors[si % defaultColors.length];
    svgParts.push(`<rect x="${lx}" y="${legendY - 8}" width="12" height="3" fill="${color}"/>`);
    svgParts.push(`<text x="${lx + 16}" y="${legendY - 3}" font-size="10" fill="${COLORS.text}">${escapeSvg(s.name)}</text>`);
    lx += 130;
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

  const width = 780;
  const height = 280;
  const padL = 50;
  const padR = 20;
  const padT = title ? 40 : 20;
  const padB = 60;
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
  parts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${width}px;height:auto">`);
  if (title) parts.push(`<text x="${width/2}" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="${COLORS.text}">${escapeSvg(title)}</text>`);

  // Y gridlines
  for (let i = 0; i <= 4; i++) {
    const v = yMin + (yMax - yMin) * (i / 4);
    const y = yScale(v);
    parts.push(`<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="${COLORS.grid}" stroke-width="0.5"/>`);
    parts.push(`<text x="${padL - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="${COLORS.textMuted}">${formatTick(v)}</text>`);
  }

  groups.forEach((g, i) => {
    const cx = padL + i * groupW + groupW / 2;
    const x0 = cx - barW;
    const x1 = cx + barW * 0.1;
    const y0 = g.companyValue != null ? yScale(g.companyValue) : yScale(0);
    const h0 = g.companyValue != null ? yScale(0) - y0 : 0;
    const y1 = g.medianValue != null ? yScale(g.medianValue) : yScale(0);
    const h1 = g.medianValue != null ? yScale(0) - y1 : 0;
    if (g.companyValue != null) {
      parts.push(`<rect x="${x0}" y="${Math.min(y0, yScale(0))}" width="${barW * 0.9}" height="${Math.abs(h0)}" fill="${COLORS.primary}"/>`);
    }
    if (g.medianValue != null) {
      parts.push(`<rect x="${x1}" y="${Math.min(y1, yScale(0))}" width="${barW * 0.9}" height="${Math.abs(h1)}" fill="${COLORS.muted}"/>`);
    }
    parts.push(`<text x="${cx}" y="${height - padB + 14}" text-anchor="middle" font-size="9" fill="${COLORS.textMuted}">${escapeSvg(g.label)}</text>`);
  });

  // Legend
  parts.push(`<rect x="${padL}" y="${height - 22}" width="12" height="10" fill="${COLORS.primary}"/>`);
  parts.push(`<text x="${padL + 16}" y="${height - 13}" font-size="10" fill="${COLORS.text}">Şirket</text>`);
  parts.push(`<rect x="${padL + 90}" y="${height - 22}" width="12" height="10" fill="${COLORS.muted}"/>`);
  parts.push(`<text x="${padL + 106}" y="${height - 13}" font-size="10" fill="${COLORS.text}">Emsal Medyan</text>`);
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

  const width = 440;
  const height = 280;
  const cx = 150;
  const cy = height / 2 + (title ? 10 : 0);
  const r = 100;
  const total = filtered.reduce((a, s) => a + s.value, 0);

  const defaultColors = [
    COLORS.primary, COLORS.accent, COLORS.success, COLORS.danger,
    '#7c3aed', '#0891b2', '#be123c', '#0f766e',
  ];

  let angleStart = -Math.PI / 2;
  const parts: string[] = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${width}px;height:auto">`);
  if (title) parts.push(`<text x="${width/2}" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="${COLORS.text}">${escapeSvg(title)}</text>`);

  filtered.forEach((s, i) => {
    const frac = s.value / total;
    const angleEnd = angleStart + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const x1 = cx + Math.cos(angleStart) * r;
    const y1 = cy + Math.sin(angleStart) * r;
    const x2 = cx + Math.cos(angleEnd) * r;
    const y2 = cy + Math.sin(angleEnd) * r;
    const color = s.color || defaultColors[i % defaultColors.length];
    parts.push(`<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${color}"/>`);

    // Legend on right side
    const lgY = 50 + i * 22;
    parts.push(`<rect x="290" y="${lgY}" width="14" height="14" fill="${color}"/>`);
    parts.push(`<text x="310" y="${lgY + 11}" font-size="10" fill="${COLORS.text}">${escapeSvg(s.label)}</text>`);
    parts.push(`<text x="${width - 10}" y="${lgY + 11}" text-anchor="end" font-size="10" font-weight="600" fill="${COLORS.textMuted}">${(frac * 100).toFixed(1)}%</text>`);

    angleStart = angleEnd;
  });

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


function escapeSvg(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
