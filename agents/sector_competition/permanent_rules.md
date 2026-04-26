# sector_competition — Permanent Rules


## 2026-04-25 — Auto-promoted (repeat_count=3)

**Kural:** THYAO ticker her zaman sector='aviation'a map edilmeli; ticker fallback 'industrial' kesinlikle override edilmeli. Hardcode peer set: IAG, DLAL (Lufthansa), ALA (Air France-KLM), RYAAY, EZJ, TKFLY; karşılaştırma EV/EBITDAR bazlı.

**Kaynak:** THYAO analizinde 3 kez tekrarlandı (sector='industrial' (ticker fallback). peer_group=[], benchmarks=[], strengths=[], weaknesses=[] — peer analizi tamamen boş. THYAO havacılık sektöründe; IAG, Lufthansa, Air France-KLM, Emirates, Ryanair peer grubu oluşturulmalıydı.)

## 2026-04-25 — Auto-promoted (repeat_count=3)

**Kural:** Aviation sektörü için hardcoded fallback peer listesi: ['IAG', 'LHA.DE', 'AF.PA', 'RYAAY', 'WIZZ', 'EZJ.L']. Sector mismatch durumunda bile fallback aktive olmalı. peer_count=0 → WARN + CEO escalation; benchmarking 'DEGRADED — manual peer injection required' olarak işaretlenmeli.

**Kaynak:** THYAO analizinde 3 kez tekrarlandı (peer_group=[], peer_count=0 — tüm metrik benchmark'ları tek noktalı (THYAO'nun kendi değeri). sector='industrial' yanlış eşleşmesi aviation peer'larını (IAG, Lufthansa, Air France-KLM, Ryanair, Wizz Air) filtreledi. Percentile ve quartile hesapları anlamsız.)
