/**
 * Pre-Core-4 Phase A — Historical PDF disk loader.
 *
 * Convention: `<PROJECT_ROOT>/data/historical_pdfs/<TICKER>/<YYYY>.pdf`
 * (or any filename containing a 4-digit year). Operator-curated copies
 * of KAP financial-report PDFs that the live data_collection KAP fetch
 * may not be able to reach (e.g., older filings outside the 6-year
 * window, or rate-limited days).
 *
 * The loader scans the directory deterministically and emits one
 * "synthetic disclosure" entry per .pdf file with:
 *   kind = 'financial_report'
 *   year = <YYYY> (parsed from filename)
 *   period_label = 'FY-<YYYY>'
 *   source_url = 'file://<absolute-path>'
 *   disclosure_index = 'historical-disk-<TICKER>-<YYYY>'
 *   content_sha256 = sha256(file bytes)
 *
 * Downstream parse_standardization receives these alongside the KAP-fed
 * documents and parses them through the same pipeline. The data
 * collection runner is responsible for de-duping by fiscal_year — when
 * a year is present in both KAP output AND the disk loader, KAP wins
 * (the live filing is canonical).
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { PROJECT_ROOT } from '../config.js';
import type { PythonCollectedDocument } from '../python/adapters/data_collection.js';

const HISTORICAL_DIR = path.join(PROJECT_ROOT, 'data', 'historical_pdfs');

/** Extracts a 4-digit fiscal year from a filename. Accepts:
 *    2024.pdf
 *    KCHOL_2024.pdf
 *    KCHOL-FY-2024.pdf
 *    2024_consolidated.pdf
 *    something_FY2024_annual.pdf
 *  Returns null if no plausible 19xx/20xx year is found. */
export function extractYearFromFilename(name: string): number | null {
  const m = name.match(/(?:^|[^0-9])((?:19|20)\d{2})(?:[^0-9]|$)/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  if (!Number.isFinite(y) || y < 1990 || y > 2100) return null;
  return y;
}

/** Synchronously reads the file and returns the lowercase hex sha256. */
function sha256File(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/** Returns absolute disk path for a ticker's historical-PDF dir. */
export function historicalDirFor(ticker: string): string {
  return path.join(HISTORICAL_DIR, ticker.toUpperCase());
}

/**
 * Scans `data/historical_pdfs/<TICKER>/` and returns one
 * PythonCollectedDocument per .pdf with a parseable year. Sorted
 * descending by year (most-recent first). Empty array when the
 * directory does not exist (Phase A is opt-in: zero impact when no
 * operator-curated PDFs are present).
 */
export function loadHistoricalPdfs(ticker: string): PythonCollectedDocument[] {
  const tk = ticker.toUpperCase();
  const dir = historicalDirFor(tk);
  if (!fs.existsSync(dir)) return [];
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const docs: PythonCollectedDocument[] = [];
  for (const name of entries) {
    if (!name.toLowerCase().endsWith('.pdf')) continue;
    const year = extractYearFromFilename(name);
    if (year == null) continue;
    const full = path.join(dir, name);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
    if (!stat.isFile()) continue;
    let sha: string;
    try {
      sha = sha256File(full);
    } catch {
      continue;
    }
    docs.push({
      kind: 'financial_report',
      disclosure_index: `historical-disk-${tk}-${year}`,
      title: `${tk} FY-${year} (operator-curated historical PDF)`,
      published_at: `${year}-12-31T00:00:00Z`,
      source_url: `file://${full.replace(/\\/g, '/')}`,
      local_path: full,
      content_sha256: sha,
      size_bytes: stat.size,
      category: 'historical_disk',
      subcategory: null,
      summary: null,
      period_label: `FY-${year}`,
      year,
    });
  }
  docs.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  return docs;
}

/**
 * Merge disk-loaded historical PDFs into a Python data_collection
 * manifest. Yields a NEW documents array; KAP-side entries always win
 * on year collision (live filing is canonical). Disk-only years are
 * appended at the END so existing UI ordering is undisturbed for live
 * runs without disk seeding.
 */
export function mergeHistoricalIntoManifest(
  ticker: string,
  manifestDocs: PythonCollectedDocument[],
): { merged: PythonCollectedDocument[]; addedFromDisk: number; addedYears: number[] } {
  const disk = loadHistoricalPdfs(ticker);
  if (disk.length === 0) return { merged: manifestDocs, addedFromDisk: 0, addedYears: [] };
  const seenYears = new Set<number>();
  for (const d of manifestDocs) {
    if (d.kind === 'financial_report' && typeof d.year === 'number') seenYears.add(d.year);
  }
  const additions: PythonCollectedDocument[] = [];
  const addedYears: number[] = [];
  for (const d of disk) {
    if (d.year != null && !seenYears.has(d.year)) {
      additions.push(d);
      addedYears.push(d.year);
    }
  }
  return {
    merged: [...manifestDocs, ...additions],
    addedFromDisk: additions.length,
    addedYears: addedYears.sort((a, b) => b - a),
  };
}
