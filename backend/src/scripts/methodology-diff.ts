/**
 * Methodology diff CLI (Block P — Plan P1C Wave 1).
 *
 * Compares the methodology snapshots of two stored sessions and prints
 * top-level + per-component differences. Read-only.
 *
 * Usage:
 *   npx tsx scripts/methodology-diff.ts <session_id_a> <session_id_b>
 */
import { getSessionMethodology, type MethodologyRegistry } from '../fact-layer/methodology.js';

interface DiffLine { path: string; a: unknown; b: unknown; }

export function diffMethodology(
  a: MethodologyRegistry | null,
  b: MethodologyRegistry | null,
): DiffLine[] {
  const out: DiffLine[] = [];
  if (a == null && b == null) return out;
  if (a == null) { out.push({ path: '<root>', a: null, b: b!.version }); return out; }
  if (b == null) { out.push({ path: '<root>', a: a.version, b: null }); return out; }
  if (a.version !== b.version) out.push({ path: 'version', a: a.version, b: b.version });
  if (a.effective_date !== b.effective_date) {
    out.push({ path: 'effective_date', a: a.effective_date, b: b.effective_date });
  }
  const componentKeys = new Set([...Object.keys(a.components ?? {}), ...Object.keys(b.components ?? {})]);
  for (const k of Array.from(componentKeys).sort()) {
    const ca = a.components?.[k] ?? null;
    const cb = b.components?.[k] ?? null;
    diffSubtree(`components.${k}`, ca, cb, out);
  }
  return out;
}

function diffSubtree(prefix: string, a: unknown, b: unknown, out: DiffLine[]): void {
  if (a == null && b == null) return;
  if (a == null) { out.push({ path: prefix, a: null, b }); return; }
  if (b == null) { out.push({ path: prefix, a, b: null }); return; }
  if (typeof a !== typeof b) { out.push({ path: prefix, a, b }); return; }
  if (typeof a !== 'object') {
    if (a !== b) out.push({ path: prefix, a, b });
    return;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ path: prefix, a, b });
    return;
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
  for (const k of Array.from(allKeys).sort()) {
    diffSubtree(`${prefix}.${k}`, ao[k], bo[k], out);
  }
}

function main(): void {
  const [sessA, sessB] = process.argv.slice(2);
  if (!sessA || !sessB) {
    console.error('Usage: methodology-diff.ts <session_a> <session_b>');
    process.exit(2);
  }
  const a = getSessionMethodology(sessA);
  const b = getSessionMethodology(sessB);
  if (!a) console.error(`session ${sessA}: no snapshot`);
  if (!b) console.error(`session ${sessB}: no snapshot`);
  const diffs = diffMethodology(a?.methodology_snapshot ?? null, b?.methodology_snapshot ?? null);
  if (diffs.length === 0) {
    console.log('IDENTICAL');
  } else {
    console.log(`DIFFS=${diffs.length}`);
    for (const d of diffs) {
      console.log(`  ${d.path}: a=${JSON.stringify(d.a)} b=${JSON.stringify(d.b)}`);
    }
  }
}

const isMainModule = (() => {
  try {
    const argvPath = process.argv[1] ?? '';
    const url = new URL(import.meta.url);
    return argvPath && (url.pathname.endsWith(argvPath) || argvPath.includes('methodology-diff'));
  } catch { return false; }
})();
if (isMainModule) main();
