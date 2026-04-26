# final_summary — Case Lessons


### 2026-04-22 — THYAO
FY2025 revenue 955.5B TRY bu kaynaktan alınmışsa KAP konsolide tabloyla sapma 40-80B TRY olabilir — bu fark hedef fiyatı 8-15 TRY doğrudan etkiler. Kaynak zinciri kırık rapor teslim edilirse Chairman güveni sarsılır.

### 2026-04-22 — THYAO
THYAO: CCC döngüsü ve working capital metrikleri chairman'ın her raporda beklediği standart set. Truncation ayrıca kf-4 ve kf-5 key findings'i tamamen kesti.

### 2026-04-23 — EREGL
sector_competition EREGL'i "industrial" olarak etiketledi (doğrusu: "steel") → peer_group=[], benchmark=[]. LLM override ile steel sektör playbook devreye alındı. Pipeline'a steel sektörü için hardcoded fallback eklenmeli; EREGL açıkça steel/flat_steel olarak tanımlanmalı.

### 2026-04-23 — EREGL
context_extraction, "EREGL_Kapsamli_Analiz_Raporu_2026.html" adlı bir platform HTML dosyasından veri çekti. "Platform çıktılarından veri alma YASAK" direktifine aykırı. context_extraction çıktısındaki finansal rakamlar (faiz karşılama 1.9x, FCF 49.718, CapEx 12-14 mn TRY) [UNVERIFIED_SOURCE] olarak işaretlendi. EREGL analizinde bu rakamlara güvenilmemeli — KAP/XBRL birincil doğrulama zorunlu.

### 2026-04-23 — EREGL
context_extraction birim tutarsızlığı: "mn TRY" etiketli rakamlar EREGL ölçeğinde "bn TRY" olmalı (FCF, CapEx, CBAM etkisi). Bu birim karışıklığı downstream'de hatalı risk skorlamaya yol açar. Büyük sanayi şirketleri (EREGL, THYAO gibi) için "mn TRY" görünce mutlaka birim doğrulaması yap.

### 2026-04-23 — EREGL (Sektör Dersi)
CBAM double-squeeze: AB safeguard kota -%47 (1 Temmuz 2026) + CBAM Phase 1 beyan (1 Ocak 2026) aynı takvim yılında. Blast furnace üreticileri (EREGL) için 2026 "double-squeeze" yılı — her steel analizinde bu iki tarih kontrol edilmeli. EAF üreticileri CBAM'den orantısız daha az etkilenir.

### 2026-04-23 — EREGL
EREGL FY2025: reported FCF 49,717mn içinde WC release 45,997mn var; normalize edildiğinde ~3,720mn TRY kalıyor. final_summary 36,800mn 'board definition' FCF gösterdi — bu da normalize edilmemiş. Fark yatırımcı için %1,238 yanıltma potansiyeli taşır.

### 2026-04-23 — ARCLK
ARCLK: EBITDA mevsimselliği nedeniyle Q1 FAVÖK*4 ≠ yıllık FAVÖK. FY2025 FAVÖK=30.2 milyar TRY (marj ~%5.8), Q1-2026 FAVÖK*4=23.4 milyar TRY (marj ~%4.5). 28.97x ile 7.24x arasındaki fark yatırımcının distress algısını materyal biçimde değiştirir; açıklama olmadan her ikisi de rapordan kaldırılabilir.

### 2026-04-24 — BIMAS
BIMAS FY2025 final_summary: retail en önemli KPI (SSSG) absent, Altman Z null, hedef fiyat absent. Özet tablo yatırım kararı için yeterli veri içermiyor.

### 2026-04-24 — KCHOL
KCHOL FY2025: FAVÖK 168.9B-212.4B TRY aralığında 3 versiyon. EV/EBITDA çarpanı her versiyonda %26 farklı sonuç verir. Kaynak: yönetim tanımı (operasyonel FAVÖK) vs IFRS 16 dahil hesaplama vs araştırma raporu estimate.

### 2026-04-24 — KCHOL (Rapor Tamamlandı)
KCHOL holding analizinde SOTP katkı tablosu Koç Grubu efektif sahipliği yansıtıyor; KCHOL legal entity doğrudan payı farklı (TUPRS: grup %51.2 vs KCHOL direct %26.2). Bu fark aynı SOTP tablosunda çift sayım riskine yol açıyor. Downstream valuation modellerinde mutlaka sahiplik tanımı (grup efektif vs. legal entity) açık belirtilmeli.
→ Kural: Holding SOTP tablolarında sahiplik tanımı her zaman "Koç Grubu efektif" mi "KCHOL doğrudan" mı olduğu parantez içinde gösterilmeli; ikisi karıştırılmamalı.

### 2026-04-24 — KCHOL (Bankacılık Konsolidasyonu)
YKBNK tam konsolidasyonu: konsolide Net Borç/FAVÖK bancaire pasifleri dahil olduğundan sanayi holdingleriyle kıyas yapılamaz. Banka için borç = funding. Bu yüzden holding analizinde "banking-excluded leverage" ayrı raporlanmalı; aksi takdirde 5.49x rakamı yanıltıcı.
→ Kural: Bankacılık iştiraki olan holdinglerde (KCHOL/YKBNK, SAHOL/AKBNK) kaldıraç oranları bankacılık konsolidasyonu hariç holding-only hesapla paralel sunulmalı; yoksa [BANK_CONSOLIDATED — direkt kıyas yapılamaz] etiketi eklenmeli.

### 2026-04-24 — KCHOL
SAHOL precedent: conditional_pass sızıntısı önceki turda da tespit edilmişti. KCHOL'de QA 0.46 ile rapor yayınlandı — hedef fiyat ve skor kartı güvenilirliği ciddi biçimde zedelendi; confidence 0.52 bunu da doğruluyor.

### 2026-04-25 — KCHOL
final_summary 'partial output' stratejisi iyi niyetli ama riskli: EBITDA_CONFLICT aktifken 192,000 mn TRY proxy kullanan Net Borç/EBITDA 5.19x rakamı raporda görünür hale geldi, kaynak notu okunmadan gerçek sanılabilir.
