# Output Integrity

Canonical rules for report structure, truncation, and cross-agent consistency.

---

## OI-001 — No truncation

Truncation is prohibited in institutional delivery. If an agent output approaches the context budget, it must:

1. Emit a `Core Analysis` block with all 28 mandatory metrics (see `mandatory_metrics.yaml`).
2. Emit a `Supplementary` block as a summary (5-10 sentences per topic).
3. Emit a `Detail JSON appendix` attachment for the full-depth numbers.
4. **Never** stop mid-sentence, mid-table, or mid-section. Any fragment is a Phase 6 retry trigger.

Phase 4 schema hardening adds a `truncation_check` boolean to every agent's output; AJV rejects `truncation_check = true`.

---

## OI-002 — Metrics array ≡ engine_snapshot

The financial_analysis agent's `metrics_array` must be a **superset** of the keys in `engine_snapshot`. The CEO gate checks `engine_snapshot ⊆ metrics_array`; an engine number not in the narrative metrics is a consistency violation.

---

## OI-003 — 12-section institutional report

Final report MUST carry these sections in order:

1. Kapak & Künye
2. Yönetici Özeti (≥ 3 sayfa eşdeğeri)
3. Şirket ve Strateji
4. Sektör ve Rekabet
5. Finansal Analiz (28 metrik + yorum paragrafları)
6. Değerleme ve Çarpan Karşılaştırması
7. Makro Geçiş ve Duyarlılık
8. KAP Olay Akışı ve Etki Haritası
9. Teknik Görünüm ve Scenario
10. Risk Haritası
11. Yatırım Tezi ve Karşı Argüman
12. Zorunlu Bildirimler ve Kaynaklar

Report formatter (see `agents/report_formatter/`) enforces this; AJV wrapper schema in Phase 4 adds `required: [section_manifest]` with `minItems: 12` on the section list.

---

## OI-004 — Cross-agent numeric consistency

Where a number appears in multiple agents' outputs (e.g. EBITDA appears in financial_analysis, sector_competition, valuation_agent), the values must match to within 0.5% (rounding tolerance). Divergence larger than that is a reconciliation violation and produces a `CROSS_AGENT_NUMERIC_DIVERGENCE` finding.

---

## OI-005 — Evidence citation

Every number in a narrative table must cite:

- `document_id` of the source (KAP announcement id, PDF hash).
- `line_item_name` as it appears in the source.
- `report_period` (e.g. "2025-Q4").

Phase 4 schema hardening adds `required: [document_id, line_item_name, report_period]` to `evidence_refs` item schema.

---

## OI-006 — Forbidden sources

Data cannot be pulled from:

- Previously published HTML/PDF/MD reports produced by this platform.
- Third-party aggregator sites (Investing.com, Yahoo Finance, Mynet Finans) for fundamentals.
- Claude training data or generic knowledge for point figures.

Valid sources: KAP, SPK, the company's IR website, Bloomberg/Reuters via authenticated fetch, official sector bulletins (IATA, IEA, OECD, BDDK).

---

## OI-007 — Chart technology

SVG only. **Chart.js / Canvas / any CDN-based chart library is forbidden** across the delivery path:

- `AGENTS.md` policy
- `agents/report_formatter/system_prompt.md`
- `scripts/html-to-pdf.mjs` enforcement pass
- `backend/src/python/report_formatter/compose.ts` render check

If any of these disagrees, this file wins. Conflict resolution during Phase 3: rewrite the dissenting file to reference `OI-007`.

---

## OI-008 — Emoji & agent-meta text

No emoji in institutional output. No agent meta-text ("As an AI assistant…", "I will now…", "Analyzing…"). The formatter strips both; upstream agents must not produce them.
