# kap_watch — Case Lessons


### 2026-04-22 — THYAO
THYAO: KAP'ın bazı endpoint'leri ISO-8859-9 (Türkçe) döndürüyor. Python client encoding fix eklenmeden tüm Türkçe metin içeren KAP bildirimleri bozuk gelir.

### 2026-04-22 — THYAO
THYAO 22-Nis: is_material=null event_classification'a geçti, oradan event_impact_mapper'da quantification_possible=false tetikledi. Zincir başından kırık olduğu için 3 agent downstream temiz iş çıkaramadı.

### 2026-04-23 — EREGL
EREGL 2026-04-20 OGK tescili ve 2026-04-17 BIST temettü endeksi değişikliği is_material=null geçti — her ikisi yüksek materyal. is_material null olduğunda event_impact_mapper hangi event'i önceliklendireceğini bilemedi.

### 2026-04-23 — EREGL
EREGL: 1594977 temettü konfirmasyonu is_material=null. Downstream event_classification da null aldı, event_impact_mapper da null devam ettirdi — materyal olay tespiti zincirin hiçbir halkasında yapılmadı.

### 2026-04-23 — ARCLK
ARCLK 2026-04-21: Hitachi Home Appliances B.V. hisselerinin satışı maddi bir varlık çıkışı. Metin okunmadan is_material=null bırakıldı; event_impact_mapper quantification_possible=false verdi ve satış bedeli ile bilanço etkisi analizde hiç ele alınmadı.

### 2026-04-24 — BIMAS
20260424 YK raporu temettü veya rehber güncellemesi içeriyorsa raporu kökten değiştirir. İşlenmemiş materyal KAP açıklaması CEO escalation gerektirir — şu an hala bilinmiyor.

### 2026-04-25 — KCHOL
KCHOL: 1582005 'Özel Durumlar Tebliği 12-(4) maddesi' classification_confidence='high' ama is_material=null — içerik hiç çıkarılmadı. Bu tebliğ büyük ihtimalle önemli kurumsal bir işlemi açıklıyordu.
