# strategic_synthesis — Case Lessons


### 2026-04-22 — THYAO
Bu sessionda convergence_score: 0 ile QA ve COO geçti ama LLM narrativede somut hedef fiyat ve senaryo analizi var. Rapor kalitesi görünenden çok daha yüksek olabilir — veya LLM narrative kaynaklarının doğrulanmamış olması durumunda çok daha düşük. İkisi de tehlikeli.

### 2026-04-22 — THYAO
THYAO: Stratejik sentez LLM narrative 4 güçlü convergence sinyali tespit etti (değerleme iskontosu, hub, Brent riski, momentum) ama Python engine convergence_score=0 bıraktı. Aradaki boşluk rapor kalitesini düşürüyor.

### 2026-04-22 — THYAO (Final Sentez)
Engine override aktif: sector=aviation, convergence_score=0.62 LLM hesapladı. 4 temel divergence tespit edildi: (D1) FY2025 güçlü finansallar ↔ FY2026 negatif event; (D2) karlılık ↔ kaldıraç; (D3) teknik bullish ↔ makro headwind; (D4) marj profili ↔ Piotroski F=4. Ağırlıklı hedef fiyat ~539 TRY (+%67 upside). Ana açık soru: IFRS16 net borç ayrımı (314 bn TRY fark). context_extraction çıktısı gelmediğinde CEO mektubu/commitment tracker bölümü boş kalıyor — bu pipeline eksikliği olarak raporla. Peer_count=0 olduğunda global airline peer benchmark kullan (DAL, UAL, IAG, LHA setini referans al).

### 2026-04-22 — THYAO
THYAO 22-Nis: IAS29 analizi atlandı. 2022-2023 YoY karşılaştırmalarında enflasyon düzeltmesi olmadan büyüme rakamları yanıltıcı. Override 0.62 için gerekçe belirsiz.

### 2026-04-23 — THYAO
THYAO 20260423: Rapor piyasa değeri 323.50 TRY bazında üretildi ama hiçbir yerde Bull/Bear/Baz target price yok. Kurumsal yatırımcı raporu hedef fiyat olmadan sunulamaz. Orchestrator valuation_agent'ı başlatmadı ve hiçbir uyarı üretmedi.

### 2026-04-23 — EREGL
EREGL: strategic_synthesis devam etti, final_summary doğru şekilde DEGRADED + rerun required işaretledi. Ancak strategic_synthesis daha erken bloklasaydı CEO sorun tespitini iki adım önceden yapabilirdi.

### 2026-04-23 — ARCLK
ARCLK Q1-2026: FCF=-19.7 milyar TRY 'positive signal' olarak sunuldu. Raporu okuyan analist FCF desteği olduğunu düşünebilirdi. Piotroski çift sınıflandırması (1/9 hem positive hem negative) analistlerin güvenilirliği sorgulamasına yol açar.

### 2026-04-24 — BIMAS
BIMAS FY2025: FCF=19.62 Milyar TL, EBITDA=42.58 Milyar TL, Net Debt/EBITDA=1.16x mevcut olmasına rağmen EV/EBITDA bazlı hedef fiyat hesaplanamadı çünkü valuation_agent çalışmadı. Peer P/E (MGROS, SOKM) da yoktu. Rapor yatırımcı kararı için kritik çıktıdan yoksun.
