# Financial Analysis Agent — Vaka Bazlı Dersler (Katman 2b)

> Önceki analizlerden CEO geri bildirimi ve vaka bazlı öğrenimler.
> Aynı şirketi veya benzer sektörü analiz ederken `Read` ile aç.

---

## CEO Geri Bildirimi — THYAO Raporu

### Eksikler:
- DSO, DIO, DPO, CCC, FCF, CAPEX/EBITDA, ROCE tamamen BLOCKED — CF tablosu olmadan hesaplanamadı.
- THYAO financial_analysis çıktısı yerine strategic_synthesis çıktısı iletildi — output yönlendirme hatası.
- IAS 29 parasal kazanç ayrıştırması yok.
- Havacılık sektörü ek metrikleri eksik — RPK, ASK, CASK, RASK, Yield, doluluk oranı, yakıt maliyet oranı.
- EBITDAR hesaplanmadı — Havacılıkta EBITDA yerine EBITDAR birincil metrik (IFRS 16).

### Havacılık kuralları:
- EBITDAR zorunlu (EBITDA + Lease). Peer karşılaştırması EBITDAR bazlı.
- Havacılık KPI'ları zorunlu: RPK, ASK, Load Factor, CASK, RASK, Yield, kargo ton-km.
- CF olmadan WC metrikleri "BLOCKED" olarak işaretle, tahmin üretme.
- EBITDAR marj benchmark: THYAO 2025 %23.2, global sektör ort. %16.1 (IATA).
- CASK US¢8.55, RASK US¢7.21, global load factor %83.6 referans.

---

## CEO Geri Bildirimi — BIMAS Raporu

### Eksikler:
- Output truncated — ROE yorumu yarıda kesildi.
- DSO, DIO, DPO, CCC tamamen BLOCKED — perakendede CCC kritik.
- Cari Oran ve Asit-Test çıktıda görünmüyor — BS mevcuttu, hesaplanabilirdi.
- NWC/Hasılat oranı eksik. OCF/FAVÖK eksik. CAPEX/EBITDA %81.9 yorumu eksik.

### Perakende kuralları:
- 4 ek metrik zorunlu: SSSG katkısı, Revenue per Store, Gross Margin by segment, IFRS 16 normalize FAVÖK.
- BS mevcutsa Cari Oran + Asit-Test HER ZAMAN hesapla — CF bloker değil.
- NWC/Hasılat BS'ten hesaplanabilir: NWC = (Cari Varlıklar - Cari Borçlar - KV Finansal Borçlar).

---

## CEO Geri Bildirimi — KCHOL Delta Raporu

### Eksikler:
- Revenue Q4/FY karışıklığı Round 2'de de sürdü — 802.669B = Q4, FY = 2.76T TRY.
- Revenue anomalisi sorgulanmadı — 3.4x fark görülünce dönem tanımı kontrol edilmedi.
- DSO tamamen BLOCKED, tahmin bile üretilmedi.
- COGS tahmini %70 gerekçesiz. IAS 29 ayrıştırması yapılmadı. 3 katlı analiz eksik.

### Holding kuralları:
- Revenue anomalisini her zaman sorgula — önceki dönemle >%50 sapma → dönem kontrolü mandatory.
- Holding gelir tablosunda 3 katman: Solo/Parent + Konsolide + Segment.
- DSO blocked olsa bile sector proxy ver — sıfır bırakma.

---

## CEO Geri Bildirimi — SAHOL Raporu

### Eksikler:
- DSO, DIO, DPO, CCC, NWC/Hasılat, Faiz Karşılama, Cari Oran, Asit-Test, ROCE, ROIC, Cash FAVÖK eksik.
- Bölüm 5 (IAS29 ROE tablosu) truncated.
- 5 yıllık IS trendi sadece 2 yıl.

### Kurallar:
- Chairman'ın 25 metrik listesi her analizde kontrol listesi olarak kullanılacak.
- WC metrikleri upstream eksik olsa bile BS'ten hesaplanacak.
- Bölüm truncation = output geçersiz. İkiye böl, yarım bölüm YASAK.

---

## Sektör Bilgi Bankası (Aktif Şirket Referansları)

**BIST değerleme (Nisan 2026):** P/E ~8-10x (tarihsel ortalama altı).
- TUPRS: Bear 110 / Baz 220 / Bull 325 TL (Mevcut ~254.50)
- THYAO: Bear 220 / Baz 550 / Bull 1,000 TRY (Mevcut ~316.75)
- KCHOL: Bear 170 / Baz 252 / Bull 338 TL (Mevcut ~204)
- SAHOL: Bear 108 / Baz 131 / Bull 155 TL (Mevcut ~89.30)
- ASTOR: Bear 140 / Baz 220 / Bull 265 TL (Mevcut ~203.50)

---

*Dosya sahibi: Financial Analysis Agent | Güncelleyen: CEO Feedback Loop*

### 2026-04-22 — THYAO
THYAO 2026-04-22: IS ve BS parse edildi ama financial_analysis'e geçiş olmadı. Büyük olasılıkla CF+SE eksikliği parse validasyonunu durdurdu. Kısmi modla EBITDA, ROCE, Net Borç/EBITDA üretilebilirdi — QA 0.757 yerine 0.68+ olurdu, rapor BLOCKED değil DEGRADED çıkardı.

### 2026-04-22 — THYAO
THYAO 2026-04-22: financial_analysis çalışmaması tek başına 4 downstream ajanı işlevsiz bıraktı ve QA score'u 0'a düşürdü. data_collection venv hatasının doğrudan yansıması; LLM fallback modu bu ajan için de aktif edilmeliydi.

### 2026-04-22 — THYAO
THYAO 22-Nis: Industrial thresholdlarla değerlendirilen havacılık şirketi. EBITDAR, EV/EBITDAR ve kira-adjusted net borç hesaplanamadı. Peer benchmark tamamen geçersiz.

### 2026-04-22 — THYAO
THYAO 22-Nis: EBITDAR eksik olunca EV/EBITDAR peer karşılaştırması yapılamadı. Önceki session'da 2.52x EV/EBITDA (kira dahil) tespiti vardı; bu session 4.40-6.10x aralığı IFRS16 muamelesine göre değişiyor — belirsizlik devam ediyor.

### 2026-04-22 — THYAO
THYAO 22-Nis: IAS29 CEO hafızasında üç kez geçti ama financial_analysis'a ulaşmadı. FY2025 etkisi minimal (79M TRY), ancak 2022-2023 YoY karşılaştırmaları enflasyon düzeltmesi gerektiriyor.

### 2026-04-23 — THYAO
THYAO 20260423: ROE %12.96 industrial norma göre 'acceptable' görünürken aviation TRY CoE (~%45-55) bağlamında -32 puan değer imhası anlamına geliyordu. Sektör hatası bu kritik bulgunun otomatik flag'ini engelledi. final_summary sector_override_note koydu ama upstream agent'lar düzeltilmedi.

### 2026-04-23 — THYAO
THYAO 20260423: EBITDAR tahmin ~222B TRY (%23.2 marj), EBITDA'dan ~38B TRY yüksek. IAG/Lufthansa karşılaştırması EBITDAR bazlı — eksik olunca tüm peer benchmarking geçersiz. EV/EBITDAR çarpanı da hesaplanamadı.

### 2026-04-23 — EREGL
EREGL FY2025: tek agent eksikliği 5 downstream agent'ı null/score=0'a çökertti. THYAO seanalarında da benzer cascade yaşandı. Çözüm: pipeline orchestrator'da financial_analysis → [qa, sector, synthesis, reconciliation, valuation] bağımlılık grafiği strict enforce edilmeli.

### 2026-04-23 — EREGL
EREGL: financial_analysis eksikliği tek başına qa_review'i 0'a, strategic_synthesis'i override_confidence=low'a, sector_competition'ı peer_group=[]'a düşürdü. Pipeline'ın en kritik P0 bağımlılığı gözden kaçtı.

### 2026-04-23 — ARCLK
ARCLK Q1-2026: balance_sheet.trade_receivables=68,225,000 TRY parse edildi; ancak Q1 revenue=130,271,680,000 TRY. Bu oran (%0.05) beyaz eşya sektöründe fiziksel olarak imkânsız. Büyük ihtimalle yalnızca bir ticari alacak alt kalemi alındı, ana alacak kalemleri (milyarlarca TRY) atlandı.

### 2026-04-23 — ARCLK
ARCLK FY2025: IAS 29 parasal kazanç tutarı faaliyet raporunda Not 2.1'de açıklanıyor. Bu tutar corpus'ta mevcut değildi; WebFetch ile KAP XBRL veya PDF'den alınabilirdi. Türkiye'de IAS 29 etkisi EBITDA marjını ±10-15 puan değiştirebilir — düzeltmesiz EBITDA marj kıyaslaması yanıltıcıdır.

### 2026-04-24 — BIMAS
BIMAS: engine 'industrial' ataması nedeniyle SSSG, LFL büyüme, mağaza başı EBITDA hesaplanamadı. sector_competition peer_group=[] kaldı. QA da sektör-spesifik KPI kontrolü yapamadı. Tek bir yanlış etiket tüm downstream'i bozdu.

### 2026-04-24 — BIMAS
BIMAS FY2025: ROE 11.2% optical. Operasyonel temizlenmiş ROE tahmin edilemiyor çünkü parse_standardization monetary_gain_loss=null bıraktı. IAS29 enflasyonist ortamda (%30.87 CPI) ROE optik-operasyonel ayrımı yatırımcı için kritik — gizlenmesi yanıltıcıdır.

### 2026-04-24 — BIMAS
BIMAS FY2025 store_count 14473 (FY2025) vs 9365 (FY2020): +5108 net açılış. Revenue CAGR ≈ %50+ TRY nominal. SSSG proxy hesaplanabilirdi. Mağaza büyümesi mi yoksa mağaza verimliliği mi sorusu yanıtsız kaldı.

### 2026-04-24 — BIMAS
BIMAS EBITDA_MARGIN=%5.9 'pressured' göründü; oysa hard-discount retail'de %6 normaldir. Yanlış sektör → yanlış sinyal → yanlış yatırım kararı riski.

### 2026-04-24 — BIMAS
BIMAS'ın -%2.3 mağaza trafiği (FY2025) SSSG hesabıyla yakalanırdı. Bu metrik olmadan operasyonel bozulma sinyal vermedi; strategic_synthesis'e pozitif sinyal olarak geçti.

### 2026-04-24 — KCHOL
KCHOL 2026-04-24: financial_analysis sıfır input alıp 28 null metrik üretti ve QA'ya geçirdi. Tüm pipeline geçersiz finansal temelde çalıştı.

### 2026-04-24 — KCHOL
KCHOL: sector='industrial' etiketiyle holding playbook hiç çalışmadı. final_summary'deki %41.3 holding iskontosu (anormal yüksek) peer benchmark olmadan not edildi, quantify edilemedi.

### 2026-04-24 — KCHOL
KCHOL FY-2025 gerçek değerleri: Gelir 2,757,295 mn TRY, FAVÖK 181.5 B TRY, Net Kâr 22,000 mn TRY. FY-2026 belgesi finansal rapor değil, özel durum bildirimidir — parse_standardization bu ayrımı yapmadığı için financial_analysis da kaymadı.

### 2026-04-24 — KCHOL
KCHOL 4. seans: sector='industrial' → 22 metrik null → qa COMPLETENESS=0.00. Sektör etiketi pipeline manifest'e CEO manifest'ten yazılmalı, her agent kendi sektör tespiti yapmamalı.

### 2026-04-25 — KCHOL
KCHOL 20260425: data_collection manifest'inde FY-2026 için iki ayrı PDF vardı (1555915=özel durum, 1555903=finansal rapor). financial_analysis özel durum PDF'ini seçti; gerçek 309KB finansal raporu atladı. Bu tek hata cascade: sector_competition=null, qa=0.46, final_summary=DEGRADED.

### 2026-04-25 — KCHOL
KCHOL 20260425: strategic_synthesis ve final_summary ikisi de 'sector=industrial HATALI — holding_conglomerate' diye flagledi; ancak financial_analysis engine override almadan çalıştı. sector_competition çıktısının %100'ü geçersizdi (8/8 benchmark null, 0 peer).

### 2026-04-25 — KCHOL
KCHOL FY-2026: sıfır veri → 33 null oran → QA COMPLETENESS=0.00 → ABORT. 1 guard satırı tüm downstream zinciri kurtarırdı.

### 2026-04-25 — KCHOL
KCHOL: YKBNK 924B TRY dahilinde Net Borç/EBITDA anlamsız. Sanayi-only oran holding kredi riskini gerçekçi yansıtır.

### 2026-04-25 — KCHOL
KCHOL 2026-02-11 KAP bildirimlerinde 1555915 (81KB özel durum) yanlış dönem etiketiyle FY-2026 sayıldı; 1555903 (367KB finansal rapor) ise FY-2025 asıl raporudur. Period etiketini döküman içeriği değil, KAP disclosure başlığından almak gerekir.

### 2026-04-25 — KCHOL
Aynı hata valuation_agent Python engine'de de tekrarladı (holding_sotp_required=false). Tek kök neden: sector enum'unda 'holding' tipi eksik — banka + sanayi holdinglerde yanlış analysis path seçiliyor.
