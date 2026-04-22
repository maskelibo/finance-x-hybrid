/**
 * QA output parser — R5.
 * Extract overall score + decision from free-form or structured QA review text.
 */

export function parseQaScore(output: string): number | null {
  const patterns = [
    /overall[_\s-]*(?:score|puan|skor)["\s:]*([0-9]+(?:[.,][0-9]+)?)/i,
    /(?:genel|toplam)[_\s]*(?:score|puan|skor)["\s:]*([0-9]+(?:[.,][0-9]+)?)/i,
    /kalite[_\s-]*(?:score|puan|skor)["\s:]*([0-9]+(?:[.,][0-9]+)?)/i,
    /qa[_\s-]*(?:score|puan|skor)["\s:]*([0-9]+(?:[.,][0-9]+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match) {
      let score = parseFloat(match[1].replace(',', '.'));
      if (score > 1.5) score = score / 10;
      return score;
    }
  }

  const jsonMatch = output.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (typeof parsed.overall_score === 'number') {
        let s = parsed.overall_score;
        if (s > 1.5) s = s / 10;
        return s;
      }
      if (typeof parsed.score === 'number') {
        let s = parsed.score;
        if (s > 1.5) s = s / 10;
        return s;
      }
    } catch {}
  }

  return null;
}

export type QaDecision = 'approved' | 'rejected' | 'revision_requested' | 'conditional_pass' | 'unknown';

export function parseQaDecision(output: string): QaDecision {
  const lower = output.toLowerCase();
  const approvalMarkers = ['approved', 'pass', 'geçti', 'onay verildi'];
  const rejectMarkers = ['rejected', 'blocked', 'reddedildi', 'bloke'];
  const revisionMarkers = ['revision_requested', 'revision required', 'revize edilmeli'];
  const conditionalMarkers = ['conditional_pass', 'conditional pass', 'koşullu'];

  if (rejectMarkers.some(m => lower.includes(m))) return 'rejected';
  if (revisionMarkers.some(m => lower.includes(m))) return 'revision_requested';
  if (conditionalMarkers.some(m => lower.includes(m))) return 'conditional_pass';
  if (approvalMarkers.some(m => lower.includes(m))) return 'approved';

  return 'unknown';
}

// R5: Critical vs soft failure classification (for hard gate at max rounds).
const CRITICAL_MARKERS = [
  'factual_error', 'factual error', 'critical_fact_missing', 'critical fact',
  'recommendation_inconsistent', 'recommendation inconsistent',
  'valuation_math_error', 'valuation math',
  'structural_breakdown', 'structural breakdown',
  'rakam hatası', 'hesaplama hatası', 'sayısal hata',
  'çelişkili tavsiye', 'çelişkili öneri',
];

const SOFT_MARKERS = [
  'narrative_weak', 'narrative weak',
  'section_short', 'section short',
  'elegance', 'style',
  'coverage_gap', 'coverage gap',
  'citation_weak', 'citation weak',
  'eksik yorum', 'zayıf anlatım', 'yüzeysel',
];

export type QaFailClass = 'critical' | 'soft' | 'unknown';

export function classifyQaFailure(output: string): QaFailClass {
  const lower = output.toLowerCase();
  const hasCritical = CRITICAL_MARKERS.some(m => lower.includes(m));
  if (hasCritical) return 'critical';
  const hasSoft = SOFT_MARKERS.some(m => lower.includes(m));
  if (hasSoft) return 'soft';
  return 'unknown';
}
