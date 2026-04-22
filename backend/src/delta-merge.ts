/**
 * Delta merge — Phase 8J (pending_fix #2 Delta Revision).
 *
 * Phase 8F zorunlu kıldı: agent çıktıları artık bir ```json ... ``` bloğu
 * taşıyor (structured head) + ardından narrative markdown. QA revision
 * turunda agent eksik bölümleri yazıyor, orijinal çıktıda değişmeyen
 * bölümleri tekrar yazmıyor.
 *
 * Eski davranış: `merged = original + "\n---\nQA REVISION EKI\n" + revision`.
 * Bu çalışıyor ama (a) çift içerik, (b) structured JSON iki kez görünüyor,
 * (c) downstream parse edince "hangi JSON güncel?" belirsiz.
 *
 * Bu modül daha temiz bir delta merge yapar:
 *   1. Hem original hem revision'dan ```json``` bloklarını çıkarır.
 *   2. Varsa JSON'ları deep-merge eder: revision orijinali override eder.
 *   3. Narrative markdown kısımlarını orijinal + "--- QA REVISION" + revision
 *      olarak birleştirir (insan okunaklı).
 *   4. Merged output = güncel JSON bloğu + birleşik narrative.
 *
 * Fail-safe: JSON parse edilemezse eski concat davranışına döner.
 * Opt-out: DELTA_MERGE_ENABLED=false env ile devre dışı bırakılır.
 */

const JSON_FENCE = /```json\s*([\s\S]*?)```/i;

export type DeltaMergeResult = {
  merged: string;
  strategy: 'json_deep_merge' | 'concat_fallback' | 'revision_only';
  originalJsonFound: boolean;
  revisionJsonFound: boolean;
  mergedKeys: string[];
};

function extractJsonBlock(text: string): { json: Record<string, unknown> | null; before: string; after: string } {
  const m = text.match(JSON_FENCE);
  if (!m) return { json: null, before: text, after: '' };
  try {
    const parsed = JSON.parse(m[1].trim());
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const idx = m.index ?? 0;
      const before = text.slice(0, idx);
      const after = text.slice(idx + m[0].length);
      return { json: parsed as Record<string, unknown>, before, after };
    }
  } catch {
    /* fall through */
  }
  return { json: null, before: text, after: '' };
}

/**
 * Deep merge: revision overrides original at same key. Arrays are REPLACED
 * (not concatenated) unless the array is explicitly marked `__append: true`
 * on the revision side (future extension). Objects recurse; primitives
 * override; missing keys in revision → keep original.
 */
function deepMerge(
  original: Record<string, unknown>,
  revision: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...original };
  for (const [k, v] of Object.entries(revision)) {
    if (v === undefined) continue;
    if (v === null) {
      out[k] = null;
      continue;
    }
    const existing = out[k];
    const bothObjects =
      existing !== null &&
      typeof existing === 'object' &&
      !Array.isArray(existing) &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      v !== null;
    if (bothObjects) {
      out[k] = deepMerge(
        existing as Record<string, unknown>,
        v as Record<string, unknown>,
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function deltaMerge(
  originalOutput: string | null | undefined,
  revisionOutput: string | null | undefined,
): DeltaMergeResult {
  const original = typeof originalOutput === 'string' ? originalOutput : '';
  const revision = typeof revisionOutput === 'string' ? revisionOutput : '';

  const enabled = (process.env.DELTA_MERGE_ENABLED || 'true') !== 'false';
  if (!enabled) {
    return {
      merged:
        original + (revision ? `\n\n---\n## QA REVISION EKI\n${revision}` : ''),
      strategy: 'concat_fallback',
      originalJsonFound: false,
      revisionJsonFound: false,
      mergedKeys: [],
    };
  }

  if (!original) {
    return {
      merged: revision,
      strategy: 'revision_only',
      originalJsonFound: false,
      revisionJsonFound: !!revision.match(JSON_FENCE),
      mergedKeys: [],
    };
  }
  if (!revision) {
    return {
      merged: original,
      strategy: 'revision_only',
      originalJsonFound: !!original.match(JSON_FENCE),
      revisionJsonFound: false,
      mergedKeys: [],
    };
  }

  const origExtracted = extractJsonBlock(original);
  const revExtracted = extractJsonBlock(revision);

  if (!origExtracted.json || !revExtracted.json) {
    // Her iki taraftan da yapılandırılmış JSON çıkaramazsak, eski
    // concat davranışına düş. Downstream manuel parse edecek.
    return {
      merged: `${original}\n\n---\n## QA REVISION EKI\n${revision}`,
      strategy: 'concat_fallback',
      originalJsonFound: !!origExtracted.json,
      revisionJsonFound: !!revExtracted.json,
      mergedKeys: [],
    };
  }

  const mergedJson = deepMerge(origExtracted.json, revExtracted.json);
  const mergedKeys = Object.keys(mergedJson);

  // Narrative'ları da birleştir — insan okunabilir bölüm.
  const origNarrative = `${origExtracted.before}${origExtracted.after}`.trim();
  const revNarrative = `${revExtracted.before}${revExtracted.after}`.trim();
  const narrativeBlock = revNarrative
    ? `${origNarrative}\n\n---\n## QA REVISION — DELTA\n${revNarrative}`
    : origNarrative;

  const merged =
    '```json\n' +
    JSON.stringify(mergedJson, null, 2) +
    '\n```\n\n' +
    narrativeBlock;

  return {
    merged,
    strategy: 'json_deep_merge',
    originalJsonFound: true,
    revisionJsonFound: true,
    mergedKeys,
  };
}
