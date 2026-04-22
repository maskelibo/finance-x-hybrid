/**
 * R5 mini-benchmark: QA hard gate building blocks.
 * parseQaScore + parseQaDecision + classifyQaFailure + getMaxQaRounds.
 */
import { parseQaScore, parseQaDecision, classifyQaFailure } from '../backend/src/qa/score-parser.js';
import { getMaxQaRounds } from '../backend/src/config.js';

let ok = 0, fail = 0;
const log: string[] = [];
const a = (c: boolean, m: string) => { if (c) { ok++; log.push(`✅ ${m}`); } else { fail++; log.push(`❌ ${m}`); } };

// --- parseQaScore
a(parseQaScore('Overall score: 0.72 — conditional') === 0.72, 'Score: 0-1 scale direct');
a(parseQaScore('genel puan 7.5 / 10') === 0.75, 'Score: 0-10 scale normalized');
a(Math.abs((parseQaScore('QA Score: 8,3 — pass') ?? 0) - 0.83) < 1e-9, 'Score: comma decimal + 0-10 normalize');
a(parseQaScore('Kalite skor: 0.91') === 0.91, 'Score: Turkish kalite skor');
a(parseQaScore('```json\n{"overall_score": 0.65}\n```') === 0.65, 'Score: JSON code block overall_score');
a(parseQaScore('No score mentioned at all') === null, 'Score: null when absent');

// --- parseQaDecision
a(parseQaDecision('Status: APPROVED — report ready') === 'approved', 'Decision: approved EN');
a(parseQaDecision('Review: rejected, major flaws') === 'rejected', 'Decision: rejected');
a(parseQaDecision('revision_requested — re-run FA') === 'revision_requested', 'Decision: revision_requested');
a(parseQaDecision('conditional_pass with concerns') === 'conditional_pass', 'Decision: conditional_pass');
a(parseQaDecision('Koşullu onay veriyoruz') === 'conditional_pass', 'Decision: conditional TR');
a(parseQaDecision('Analiz geçti tüm kontrolleri') === 'approved', 'Decision: geçti TR');
a(parseQaDecision('Strange unstructured text here') === 'unknown', 'Decision: unknown fallback');

// --- classifyQaFailure
a(classifyQaFailure('factual_error in EBITDA calc, P0') === 'critical', 'Class: critical factual_error');
a(classifyQaFailure('valuation math error on DCF') === 'critical', 'Class: critical valuation math');
a(classifyQaFailure('Hesaplama hatası Tabloda') === 'critical', 'Class: critical TR hesaplama');
a(classifyQaFailure('narrative_weak, citation_weak') === 'soft', 'Class: soft narrative+citation');
a(classifyQaFailure('Section short on macro, elegance low') === 'soft', 'Class: soft section_short');
a(classifyQaFailure('Yüzeysel analiz, eksik yorum') === 'soft', 'Class: soft TR yüzeysel');
a(classifyQaFailure('random text with no markers') === 'unknown', 'Class: unknown fallback');

// --- getMaxQaRounds
a(getMaxQaRounds('fast_screening') === 2, 'Rounds: fast_screening=2');
a(getMaxQaRounds('standard_institutional') === 3, 'Rounds: standard_institutional=3');
a(getMaxQaRounds('deep_dive') === 5, 'Rounds: deep_dive=5');
a(getMaxQaRounds('LIGHT') === 2, 'Rounds: LIGHT alias=2');
a(getMaxQaRounds('INSTITUTIONAL') === 5, 'Rounds: INSTITUTIONAL alias=5');
a(getMaxQaRounds() === 3, 'Rounds: default env fallback=3');
a(getMaxQaRounds('nonexistent_mode') === 3, 'Rounds: unknown mode → env fallback');

console.log(log.join('\n'));
console.log(`\n=== Result: ${ok} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
