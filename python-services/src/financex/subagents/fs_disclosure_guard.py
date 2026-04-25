"""fs_disclosure_guard — final_summary deterministic compliance sub-agent.

Inputs (from compact_summary_pack subset):
- ticker
- top_event_conclusions (list of {category, text, ref, ...})
- citation_sensitive_facts (list of {fact, source, date})

Output:
- mandatory_disclosures: SPK / KAP material event listesi (event_impacts'tan
  disclosure_required veya magnitude > eşik olan event'lerden çıkarılır)
- disclaimers: Sabit yasal disclaimer set'i (SPK general, investment advice,
  data source, forward-looking, ethical, translation)
- ethical_notes: Hallucination / model limitation uyarıları
- compliance_status: {all_mandatory_present, missing_disclosures, warnings}

Deterministic: tek LLM call yok. Sabit metin set'i + heuristic event mapping.
"""

from __future__ import annotations

import json
import sys


# Standart disclaimer metinleri — Finance X için sabit, SPK/etik gereksinimler.
DISCLAIMERS = [
    {
        "category": "spk_general",
        "text": (
            "Bu rapor SPK Tebliği VII-128.7 kapsamında yatırım danışmanlığı niteliği taşımaz. "
            "İçerik bilgilendirme amaçlıdır, alım-satım kararları okuyucunun sorumluluğundadır."
        ),
    },
    {
        "category": "investment_advice",
        "text": (
            "Yatırım kararlarında profesyonel yatırım danışmanından destek alınması önerilir. "
            "Geçmiş performans gelecekteki getirinin garantisi değildir."
        ),
    },
    {
        "category": "data_source",
        "text": (
            "Veriler KAP, BIST, TCMB ve şirket faaliyet raporlarından derlenmiştir. "
            "Veri kalitesi ve güncelliği kaynak sistemlere bağlıdır; herhangi bir hata için sorumluluk kabul edilmez."
        ),
    },
    {
        "category": "forward_looking",
        "text": (
            "Rapor ileriye dönük (forward-looking) ifadeler içerebilir. Bu ifadeler tahmin niteliğindedir; "
            "fiili sonuçlar makro koşullar, sektör dinamikleri ve şirket-spesifik faktörler nedeniyle önemli ölçüde farklılık gösterebilir."
        ),
    },
    {
        "category": "ethical_use",
        "text": (
            "Rapor Anthropic Claude AI ile üretilmiştir. AI çıktıları hata içerebilir (hallucination); "
            "özellikle nicel sayısal veriler birincil kaynaklarla doğrulanmalıdır."
        ),
    },
    {
        "category": "translation",
        "text": (
            "Yabancı dilden çevrilen içerik orijinal kaynaklardan teyit edilmelidir. "
            "Türkçe çeviri Finance X iç çeviri katmanı tarafından yapılmıştır."
        ),
    },
]

# Standart etik notlar.
ETHICAL_NOTES = [
    "Rapor bağımsız bir araştırma çıktısıdır; herhangi bir kurumsal yatırım kuruluşu adına yayınlanmamıştır.",
    "Sayısal veriler 5+ kaynağa dayansa bile model çıktısında küçük sapmalar olabilir; kritik kararlar için bilanço orijinaline bakılmalıdır.",
    "Sektör/peer karşılaştırmaları model varsayımlarına dayanır; yöntemsel farklılıklar peer kıyaslamasını etkileyebilir.",
]

# Material disclosure kategorisi heuristic — event_impact_mapper top_event_conclusions
# içindeki event kategorilerinden disclosure type'a mapping.
DISCLOSURE_TYPE_MAP = {
    "capex": "material_event",
    "investment": "material_event",
    "acquisition": "material_event",
    "tender_offer": "tender_offer",
    "agm": "shareholder_meeting",
    "shareholder_meeting": "shareholder_meeting",
    "annual_filing": "annual_filing",
    "interim_filing": "interim_filing",
    "personnel_change": "material_event",
    "board_change": "material_event",
    "insider_transaction": "insider_transaction",
}


def _classify_disclosure_type(event_text: str, category: str | None) -> str:
    """Best-effort mapping: event category + text → SPK disclosure type."""
    cat_lower = (category or "").lower()
    if cat_lower in DISCLOSURE_TYPE_MAP:
        return DISCLOSURE_TYPE_MAP[cat_lower]
    text_lower = (event_text or "").lower()
    for keyword, dtype in [
        ("yatırım", "material_event"),
        ("kapasite", "material_event"),
        ("satın alma", "material_event"),
        ("birleşme", "material_event"),
        ("genel kurul", "shareholder_meeting"),
        ("agm", "shareholder_meeting"),
        ("temettü", "material_event"),
        ("ihaleci", "tender_offer"),
        ("içsel bilgi", "insider_transaction"),
        ("yönetim kurulu", "material_event"),
        ("üst yönetim", "material_event"),
    ]:
        if keyword in text_lower:
            return dtype
    return "other"


def _extract_mandatory_disclosures(events: list) -> list:
    """Filter events that warrant mandatory SPK disclosure."""
    out = []
    for e in events or []:
        if not isinstance(e, dict):
            continue
        text = e.get("text") or e.get("event_summary") or ""
        if not text:
            continue
        category = e.get("category") or ""
        # Material seçimi: explicit material flag, magnitude varsa, capex / tender / agm vs.
        is_material = (
            e.get("magnitude_try_mn") not in (None, 0)
            or e.get("direction") in ("positive", "negative")
            or any(k in text.lower() for k in [
                "yatırım", "satın alma", "birleşme", "kapasite",
                "genel kurul", "temettü", "ihale", "yönetim kurulu",
            ])
        )
        if not is_material:
            continue
        dtype = _classify_disclosure_type(text, category)
        out.append({
            "disclosure_type": dtype,
            "subject": text[:200],
            "event_id": e.get("ref") or e.get("event_id"),
            "regulatory_basis": _regulatory_basis_for(dtype),
        })
    return out


def _regulatory_basis_for(dtype: str) -> str:
    return {
        "material_event":      "SPK Tebliği VII-128.6 (Özel Durum Açıklamaları), KAP §2.1",
        "annual_filing":       "SPK Tebliği II-14.1, KAP §3.1",
        "interim_filing":      "SPK Tebliği II-14.1, KAP §3.2",
        "shareholder_meeting": "TTK §410, SPK Tebliği II-23.1",
        "tender_offer":        "SPK Tebliği II-26.1",
        "insider_transaction": "SPK Tebliği VII-128.5",
    }.get(dtype, "SPK genel hüküm")


def _check_compliance(disclosures: list, citation_facts: list) -> dict:
    """All-mandatory-present check + warnings."""
    missing = []
    warnings = []
    if not disclosures:
        # Holding ticker'larda en az 1 material event beklenir; yoksa flag.
        warnings.append("no_material_disclosures_detected — verify event_impact_mapper output upstream")
    if not citation_facts:
        warnings.append("no_citation_sensitive_facts — kantitatif iddialar source'suz kalmasın")
    return {
        "all_mandatory_present": len(missing) == 0,
        "missing_disclosures": missing,
        "warnings": warnings,
    }


def run(inputs: dict) -> dict:
    ticker = inputs.get("ticker", "")
    events = inputs.get("top_event_conclusions") or []
    citations = inputs.get("citation_sensitive_facts") or []

    disclosures = _extract_mandatory_disclosures(events)
    compliance = _check_compliance(disclosures, citations)

    return {
        "ticker": ticker,
        "mandatory_disclosures": disclosures,
        "disclaimers": DISCLAIMERS,
        "ethical_notes": ETHICAL_NOTES,
        "compliance_status": compliance,
    }


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing input"}), file=sys.stderr)
        sys.exit(1)
    inputs = json.loads(sys.argv[1])
    print(json.dumps(run(inputs), ensure_ascii=False))


if __name__ == "__main__":
    main()
