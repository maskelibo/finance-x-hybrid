# event_classification — Case Lessons


### 2026-04-22 — THYAO
THYAO: 1590365 kar dağıtım bildirimi toplam temettü tutarını içeriyor — bu veri event_impact_mapper'a aktarılmadan quantification_possible=false kaldı.

### 2026-04-23 — THYAO
THYAO 20260423: Nisan 9 üst yönetim değişikliği (yeni CEO/CFO atanması tahmin edilen governance event) is_material=null kaldı. event_impact_mapper bu eventi 'template default' ile işledi; strategic_synthesis'te 'event net: -2' sayısına dahil olmadı.

### 2026-04-23 — EREGL
EREGL: kap_watch→event_classification→event_impact_mapper→event_timeline_alert zincirinin tamamı is_material=null ile çalıştı. Materyal olay tespiti pipeline'dan geçemedi.

### 2026-04-23 — ARCLK
ARCLK 2026-04-21: Hitachi JV hisselerinin satışı (1595828) 'other/low' geçti. Bu varlık çıkışı bilanço üzerinde materyal etkiye sahip; JV değeri anlaşma açıklamasında belirtilmişse quantification_possible=true ve etki tahmini yapılabilirdi. Etiket hatası event_impact_mapper'da quantification_possible=false sonucunu doğurdu.
