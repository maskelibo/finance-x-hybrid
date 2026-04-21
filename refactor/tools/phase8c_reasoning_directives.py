#!/usr/bin/env python3
"""
Phase 8C — Reasoning Quality Directives (REFACTOR_BRIEF.md §9.2)

Amaç: analitik ağırlıklı agent'ların system_prompt.md dosyasına standart
"Reasoning Quality Directives" bloğu eklemek. Mevcut içerik SİLİNMEZ.

Brief §9.2:
- Önce hipotez kur, sonra veriyle test et
- En az 3 alternatif yorumu değerlendir
- Sayıları sadece raporlama, anlamlandır
- "X şöyledir ÇÜNKÜ..." yaz
- Her tez için karşı argüman
- TRY etkisini sayısallaştır
- Sektör benchmark olmadan metrik yorumu yok

Idempotent: marker kontrolü ile.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AGENTS_DIR = ROOT / "agents"

# Analitik ağırlıklı — interpretation/yorum üreten agent'lar
REASONING_AGENTS = {
    "ceo", "coo",
    "financial_analysis", "valuation_agent", "reconciliation",
    "sector_competition", "macro_analysis", "technical_analysis",
    "sentiment_news_agent", "analyst_consensus_agent", "esg_agent",
    "event_impact_mapper", "event_timeline_alert", "event_classification",
    "qa_review", "strategic_synthesis", "final_summary",
    "agent_performance_review",
}

MARKER = "<!-- PHASE_8C_REASONING_DIRECTIVES -->"

BLOCK = f"""
{MARKER}
## REASONING QUALITY DIRECTIVES (brief §9.2)

Aşağıdaki kurallar her analitik cümleye uygulanır. Schema minLength
kontrolleri interpretation'ların derinliğini zorunlu kılar; bu bölüm
**nasıl düşüneceğini** tanımlar.

1. **Önce hipotez kur, sonra veriyle test et.** Yorum yazmadan önce
   "varsayımım X'ti; veri şunu gösterdi" diye düşün.
2. **En az 3 alternatif yorumu değerlendir.** Tek bir nedensel açıklamayla
   yetinme — "A olabilir, ama B veya C de mümkün" diye karşılaştır.
3. **Sayıları sadece raporlama, anlamlandır.** "ROE %14" değil
   "ROE %14 — TRY CoE ~%30'un altında, değer yaratımı NEGATİF".
4. **"X şöyledir" değil "X şöyledir ÇÜNKÜ ..." yaz.** Her tez için
   neden-sonuç zinciri açık olmalı.
5. **Her tez için karşı argüman.** Counter-hypothesis'i
   değerlendirmeden yoruma kesinlik verme.
6. **TRY etkisini sayısallaştır.** YP/TRY ayrımı, mutlak TRY delta,
   yüzde etki — "kur etkisi" lafı yetmez, rakam iste.
7. **Sektör benchmark'ı olmadan metrik yorumu yok.** Her oran
   `canonical/sectors/<sector>.yaml`'daki benchmark ile kıyaslanır.
   Benchmark yoksa `[benchmark missing — flag]` yaz.

**Interpretation formatı:** Ne kadar? → Nasıl değişti? → Neden? → TRY etkisi? → Karşı argüman?
{MARKER}
"""


def splice(text: str) -> tuple[str, bool]:
    if MARKER in text:
        return text, False

    lines = text.splitlines(keepends=True)
    # İnsertion noktası: 8B bloğunun hemen ardı varsa; yoksa dosya başı.
    insert_idx = None
    phase8b_end_marker = "<!-- PHASE_8B_CANONICAL_REFS -->"
    count = 0
    for i, line in enumerate(lines):
        if phase8b_end_marker in line:
            count += 1
            if count == 2:
                insert_idx = i + 1
                break
    if insert_idx is None:
        # Title'dan sonra ilk ##'ten önce
        first_h1_done = False
        in_code = False
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code = not in_code
                continue
            if in_code:
                continue
            if not first_h1_done and stripped.startswith("#"):
                first_h1_done = True
                insert_idx = i + 1
                continue
            if first_h1_done and stripped.startswith("##"):
                insert_idx = i
                break
    if insert_idx is None:
        insert_idx = len(lines)

    new_lines = lines[:insert_idx] + [BLOCK, "\n"] + lines[insert_idx:]
    return "".join(new_lines), True


def main() -> int:
    touched = 0
    idempotent = 0
    skipped = 0
    header = f"{'agent':<32}{'status':<16}{'lines_after':>12}"
    print(header)
    print("-" * len(header))
    for agent_dir in sorted(AGENTS_DIR.iterdir()):
        if not agent_dir.is_dir():
            continue
        agent = agent_dir.name
        prompt = agent_dir / "system_prompt.md"
        if not prompt.exists() or agent not in REASONING_AGENTS:
            skipped += 1
            continue
        text = prompt.read_text(encoding="utf-8")
        new_text, inserted = splice(text)
        after = len(new_text.splitlines())
        if inserted:
            prompt.write_text(new_text, encoding="utf-8")
            touched += 1
            status = "INSERTED"
        else:
            idempotent += 1
            status = "already-has"
        print(f"{agent:<32}{status:<16}{after:>12}")
    print("-" * len(header))
    print(f"Touched: {touched}  |  Idempotent: {idempotent}  |  Skipped (out of scope): {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
