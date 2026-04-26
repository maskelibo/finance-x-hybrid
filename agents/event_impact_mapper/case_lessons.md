# event_impact_mapper — Case Lessons


### 2026-04-22 — THYAO
THYAO: Nisan 2026 CEO dahil üst yönetim değişikliği havayolu hisseleri için anlamlı fiyat etkisi yaratır. Template routing bu event'ı yalnızca 'equity' affected_line_item olarak işaretledi — yetersiz.

### 2026-04-22 — THYAO
THYAO 22-Nis: 2025 temettü dağıtım tutarı KAP'ta bildirildi ama hesaplanmadı. CEO değişikliği 'low urgency' geçirildi — quantification yapılsaydı near_term yüksek belirsizlik skoru tetiklenirdi.

### 2026-04-23 — THYAO
THYAO 20260423: 9 Orta Doğu rotası askıya alınması impact='uncertain' kaldı; macro_analysis bu event için %15-25 yolcu geliri kaybı tahmin etmişti. event_impact_mapper bağlantıyı kurmadı, strategic_synthesis 'event net: -2' dedi ama parasal ölçüm final raporda yok.

### 2026-04-23 — EREGL
EREGL: OGK tescili (1595638) ve BIST temettü endeks değişikliği (1594977) için pasif fon alım-satım akışı hesaplanmadı. CBAM brüt 7-10bn TRY yükü event_impact_mapper'a hiç girmedi. 35 event'in tamamı null kaldı.

### 2026-04-23 — EREGL
EREGL: 1594977 BIST Temettü Endeksi KAP bildirimi temettü tutarı içerebilirdi; LLM okusaydı quantify ederdi. Tüm eventlara aynı null etiketi yapıştırıldı.

### 2026-04-24 — BIMAS
Geri alım olayı (1576224) için EPS seyreltme etkisi ve float azalması hesaplanmadı. Bu bilgi BUY sinyal gücünü artırırdı; strategic_synthesis'e geçmedi.

### 2026-04-24 — KCHOL
KCHOL: ARCLK Hitachi çıkışı ($261M ≈ 11.7B TRY) external_research'te 3 kaynak ve fiyatla belgelendi, event_impact_mapper'da quantification_possible=false çıktı. Cross-agent veri akışı köprüsü eksik.

### 2026-04-24 — KCHOL
KCHOL için 1582005 (Özel Durumlar Tebliği 12/4 — yüksek güven), 1577703 (Olağan Genel Kurul kararları tescili) gibi yüksek güvenlikli olaylar dahi sayısal etki olmaksızın 'uncertain' kaldı. strategic_synthesis 'net +12/-3' sayacı gerçek analiz değil, ham sayım.

### 2026-04-24 — KCHOL
KCHOL: ARCLK-Hitachi satışı (Nisan 2026) hem KCHOL değerlemesini hem ARCLK SOTP hesabını etkiliyor. İki ajan (event_impact_mapper, valuation_agent) bağımsız olarak bu olayı işlemeliydi; ikisi de ihmal etti.

### 2026-04-25 — KCHOL
KCHOL 20260425: 1582005 nolu bildirim (Özel Durumlar Tebliği 12-4, yüksek güven, material_event) pipeline'da derinlemesine analiz edilmedi. Bu tip bildirimin içeriği (pay geri alım programı, yönetim değişikliği vb.) fiyata doğrudan etki edebilir.

### 2026-04-25 — KCHOL
KCHOL 1582005: Özel Durumlar Tebliği 12-(4) — büyük olasılıkla pay geri alımı veya varlık hareketi. LLM refinement 30 saniyede içeriği çekebilirdi.

### 2026-04-25 — KCHOL
1582005 KAP duyurusunun içeriği hiçbir agent tarafından fetch edilmedi. High-confidence material_event olarak sınıflandırıldı ama ne olduğu bilinmiyor. LLM'in minimum görevi bu URL'yi açıp özet üretmekti.
