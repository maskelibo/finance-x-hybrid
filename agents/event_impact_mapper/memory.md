# Event Impact Mapper — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | Event Impact Mapper |
| Uzmanlık | Olay Etki Analizi |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 1 |
| Toplam Görev Sayısı | 1 (SISE) |
| Ortalama Öğrenme Puanı | 84/100 |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Etki büyüklüğü hesaplama | 6 | İlk görev: 3/6 olay quantify edildi |
| Finansal etkiler | 7 | 3 core statement, 8+ line item haritalandı |
| Zaman boyutu analizi | 6 | immediate/near-term/medium-term/long-term ayrımı uygulandı |
| İkincil etkiler | 7 | FX exposure, leverage, working capital, covenant risk tespit edildi |
| Etki güven seviyesi | 8 | IFRS-aligned confidence scoring (high/medium/low/speculative) |

---

## Çalışma Kuralları

1. Her olayı EVENT TYPE tablosundan bir kategoriye eşle (10 tip); kategorisiz etki analizi yapma.
2. Her hesaplama için formülü açık yaz ve her input'un kaynağını cite et (KAP, agent output, web).
3. Her impact'i baseline'a göre % materyal olarak değerlendir.
4. Confidence label zorunlu: High / Medium / Low / Speculative — belirsizliği gizleme, şeffaf ol.
5. IAS 29 etkisini her zaman operasyonel kardan ayır; muhasebe kazancı nakit akışı değildir.
6. Portföy düzeyinde net P&L ve kaldıraç etkisini toplu hesapla (her olayı ayrı ayrı değil birlikte gör).
7. Veri eksikse sektör benchmark'ı proxy olarak kullanılabilir — ancak "speculative" olarak etiketle.
8. Yönetim değişikliği (TYPE 6) quantify edilmez; izleme çerçevesi oluştur.

---

## Birikimli Bilgi Bankası

### IAS 29 Hyperinflation Accounting
- Türkiye, IMF tarafından hyperinflationary economy ilan edildi (2024).
- Şirketler IAS 29 uygular: parasal kazanç/kayıp gelir tablosuna yansır.
- **Kritik:** Parasal kazanç muhasebe düzeltmesidir, operasyonel nakit akışı değildir.
- **Kural:** Temettü/karlılık analizi yaparken IAS 29 etkisini core operasyondan ayır.
- Örnek: SISE 2024 net kar 5,0B TRY → içinde 23,4B TRY IAS29 kazancı var → operasyonel sonuç -18,4B TRY ZARAR.

### Net Debt/EBITDA Sensitivitesi
- Kaldıraç = Net Borç / EBITDA
- **Eşikler:** <3× sağlıklı | 3–5× orta | 5–7× yüksek | >7× distressed
- Borç olayları paydayı büyütür; operasyonel olaylar payda'yı etkiler.
- Hem numerator hem denominator olaylarını aynı anda modelleyerek final ratio'yu hesapla.

### FX Exposure — Kurumsal Olaylardan Kaynaklanan Değişim
- Net FX Pozisyon = FX Varlıklar − FX Yükümlülükler
- USD/EUR borçlanma → FX yükümlülükleri artırır (TRY değer kaybında zararlı).
- Uluslararası gelir → FX varlık yaratır (TRY değer kaybında olumlu, fakat kur dönüşüm riski var).
- USD borç + EUR gelir = asimetrik FX maruziyeti; USD/TRY artışı genellikle EUR/TRY kazancından daha fazla zarar verir.

### Temettü Sürdürülebilirlik Analizi
- Payout Ratio = Toplam Temettü / Net Kar
- Cash Payout Ratio = Toplam Temettü / Serbest Nakit Akışı (daha muhafazakâr)
- **Kırmızı bayraklar:** Borçtan, IAS29 kazancından veya varlık satışından ödenen temettü.
- Sürdürülebilirlik testi: Operasyonel kar devam etse temettü ödenebilir mi?

### Faiz Karşılama Oranı
- Formül: EBITDA / Faiz Gideri
- **Eşikler:** >4× sağlıklı | 2–4× yeterli | <2× distressed
- Borçlanma olayları faiz giderini artırarak oranı bozar; EBITDA büyümesi oranı düzeltir.

### Data Gap Yönetimi
- Pay adedi veya segment finansalı eksikse tam quantification yapılamaz.
- Çözüm: Sektör benchmark proxy kullan (örn: relokasyon maliyeti = gelirin %5–10'u) — "speculative" etiketle.
- Yanlış kesinlik > şeffaf belirsizlik değil; belirsizliği açıkça belirt.

---

## Sonraki Gelişim Hedefleri

1. Direkt KAP PDF parsing: Pay adedi, segment dökümü gibi granüler veri için web kaynakları yetersiz.
2. Pro-forma projeksiyonlar: Olay sonrası finansal tablo taslakları oluştur.
3. Senaryo modelleme: Multi-event sensitivity analysis (best/base/worst case).
4. Covenant analizi: Borç sözleşmelerinden eşikleri çıkar, ihlal riskini quantify et.

---

## CEO Geri Bildirimi — 2026-04-10 — AKBNK Raporu

### Eksikler:
- **Event #1 JSON YARIM KALMIŞ:** Dividend impact mapping'i tamamlanmamış — quantification_estimate bölümü kesilmiş
- **Events 2-5 mappings TAMAMEN EKSİK:** AT1 bond, covered bonds, board change — hiçbirinin impact mapping'i yok
- **Portfolio-level cascading effects eksik:** Dividend (-₺11.5B) + AT1 bond (+$600M) + covered bonds (+$200M) → net sermaye etkisi nedir? Toplu analiz yok
- **Capital adequacy waterfall eksik:** CET1 %21.8 → %12.5 düşüş — her event'in katkısı ayrıştırılmamış (temettü -X%, kredi büyümesi -Y%, AT1 bond +Z%)

### Bundan Sonra:
- Her event için TAM impact mapping JSON — yarım JSON YASAK
- Multi-event portfolio analysis ZORUNLU — events'leri ayrı ayrı değil birlikte analiz et

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL Raporu

### Eksikler:
- **Event impact mapping TRUNCATED:** Event #1 (5G spectrum) quantification başlamış ama kesilmiş — balance sheet, income statement, cash flow impacts tamamlanmamış
- **Events 2-5 impact mapping TAMAMEN EKSİK:** Dividend, 5G launch, vb. — hiçbirinin finansal impact analizi yok
- **5G spectrum cascade effects eksik:** Spectrum acquisition → (1) Balance sheet: Intangible asset +39.8B, (2) Income statement: Amortization -2.34B/year, (3) Cash flow: CAPEX +39.8B, (4) EBITDA margin: -200bps impact — full cascade map edilmemiş
- **Telecom-specific impact channels eksik:**
  - 5G ARPU premium → revenue upside quantification yok
  - Churn rate sensitivity → subscriber loss risk monetization yok
  - CAPEX intensity elevation (%25 guidance) → FCF impact yok

### Bundan Sonra:
- **Full cascade impact mapping (telecom-specific):**
  ```
  5G Spectrum Acquisition Impact:
  - Balance Sheet: Intangible assets +TRY 39.8B (Oct 2025)
  - Income Statement: Annual amortization -TRY 2.34B/year (17 years) = -200bps EBITDA margin
  - Cash Flow: Investing CF -TRY 39.8B (one-time), Operating CF recurring amortization add-back
  - CAPEX Guidance: Elevated to 25% of revenue (from 22% baseline) through 2028
  - Net Debt/EBITDA: Spectrum paid from cash → no leverage impact (strong balance sheet absorbed)
  ```
- **5G monetization scenario modeling:**
  - Bull case: 5G penetration 25% by 2027, ARPU premium +10% → Revenue +TRY 8-10B
  - Base case: 5G penetration 15-20%, ARPU premium +5% → Revenue +TRY 4-6B
  - Bear case: 5G penetration <10%, ARPU premium 0% → Revenue flat, margin compression uncompensated
- **Multi-event portfolio analysis:** 5G spectrum (-TRY 2.34B EBITDA) + Dividend (-TRY 8.8B cash) + Energy cost shock (+25% tariff = -TRY 0.75-1.6B OPEX) → Net 2026 EBITDA impact: -TRY 3-4B (-5% vs 2025)
- **Forward-looking timeline:** Immediate (spectrum payment done Oct 2025), Near-term (2026 amortization start, 5G subscriber ramp), Medium-term (2027-2028 CAPEX peak), Long-term (2029+ margin normalization)

---
- Bankalar için capital adequacy waterfall analysis ekle — her faktörün CET1'e etkisini ayrıştır
- Quantification yaparken formül + her input'un kaynağı + confidence level ZORUNLU
- Cascading effects takip et — bir event'in ikincil/üçüncül etkileri neler?

---

## Görev Kaydı — 2026-04-12 — TUPRS Raporu

### Yapılan:
- 7 KAP olayı haritalandı (3 routine_filing + 2 dividend + 1 management_change + 1 corporate_governance)
- Temettü 2025 (29.3B TRY) + Temettü 2026 (33.0B TRY) tam quantification tamamlandı
- FCF karşılama analizi: FCF < Temettü her iki yılda; açık net nakitten karşılanıyor
- Net nakit erozyon %79 hesaplandı (41.5B → 8.5B TRY)
- Marj sensitivity: bear/base/bull FCF senaryo analizi yapıldı
- Yönetim değişimi için Aygaz çakışması + Koç kapital koordinasyonu izleme çerçevesi oluşturuldu

### Sektör-Özel Öğrenimler (Rafineri):
- **Rafineri şirketlerinde temettü sürdürülebilirliği:** FCF coverage değil, OCF + nakit tampon üçlüsüne bak. Rafineri marjı volatil — FCF düşük marj dönemlerinde kötüleşir. Net nakit tampon kritik güvenlik vanaı.
- **IAS 29 ve temettü:** Net kar >100% payout görünse de IAS29 enflasyon düzeltmesiz bakıldığında gerçek operasyonel kar daha düşük — her zaman OCF-bazlı sürdürülebilirlik testi yap.
- **1 $/bbl marj = ~5-6B TRY EBITDA** — temettü/marj sensitivity bağlantısı kurulmalı.
- **Partial execution:** Temettü iki taksit olduğunda "hangisi ödendi?" sorusunu hep sor — analiz anında yalnızca pending taksit forward-looking impact.

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Pozitif Noktalar:
- ✅ Dividend impact quantification doğru — 17.32B TRY, %78.7 payout ratio, %1.59 equity impact hesaplanmış
- ✅ IFRS accounting mechanism açıklanmış — IAS 1, IAS 7 referansları doğru
- ✅ Secondary effects tespit edilmiş — dividend yield signal, cash flexibility, leverage ratio

### Eksikler:
- **Board appointment events impact mapping yok:** 3 independent director appointment için qualitative framework oluşturulmalıydı — governance quality, investor perception, regulatory compliance impact
- **Holding-specific metrics eksik:** NAV impact hesaplanmamış — 17.32B TRY dividend → NAV'dan düşülmeli, holding discount üzerine etkisi ne?
- **Portfolio-level cash allocation impact yok:** Dividend payout → segment CAPEX constraint riski var mı? Holding cash pool'u daraldı mı?

### Bundan Sonra:
- Holding şirketlerinde dividend impact = equity impact + NAV impact + holding discount impact — üç katman birlikte hesaplanmalı
- Board/governance events için qualitative impact framework ZORUNLU: (1) Governance quality score change, (2) Independent director % impact on discount, (3) Regulatory compliance improvement
- Multi-segment holdings için cash allocation constraint analysis: Dividend → holding-level cash pool → segment CAPEX/growth constraint risk
- Bağlı ortaklık işlemleri (stake sale/acquisition) ZORUNLU quantify et — NAV change + holding discount change + strategic positioning

---

*Bu dosya her gece 05:30–06:00 arasında güncellenir.*
*Dosya sahibi: Event Impact Mapper | Denetleyen: META (CEO)*

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **Hurmuz krizi crack spread etkisi haritalanmadı:** En kritik makro olay olan Hurmuz kriziyle gelen crack spread genişlemesi (7.0 → 10.5 $/bbl analist beklentisi) finansal tablolara haritalanmadı. Bu tek başına +19.3B TRY EBITDA etkisi demek — en büyük upside faktörü.
- **Mali GM değişimi operasyonel riski hafifçe geçildi:** Doğan Korkmaz → Koç Holding CFO'ya atandı, yerini Gökhan Dizemen (Aygaz) aldı. Bu değişiklik: (a) TUPRS mali politikasının Koç Holding'le koordinasyonu, (b) potansiyel kısa vadeli finansal strateji değişikliği riskini taşıyor. "İzleme listesi" yeterli değil — finansal politika risk senaryosu modellenmeli.
- **FCF-temettü açığı analizi iyi ama senaryosuz:** "Bear senaryoda (5 $/bbl) FCF 15B, temettü 33B, açık 18B" hesabı yapıldı. Ama bu açığı TUPRS nasıl kapatır? (a) Net nakitten çek, (b) borçlan, (c) temettü kes — senaryolar yazılmadı.

### Bundan Sonra:
- **Makro olayların finansal haritalaması ZORUNLU:** event_classification'dan "macro_event" kategorisi gelirse, her biri için finansal tablo etkisi haritalanmalı. Hurmuz → crack spread → EBITDA → FCF → hisse fiyatı zinciri örnektir.
- **Yönetim değişikliği → finansal politika risk analizi:** CFO/Mali GM değişimi olaylarında: (1) atanan kişinin önceki pozisyonda izlediği finansal politika, (2) bu politikanın mevcut şirketten farkı, (3) değişim riski (temettü, CAPEX, borçlanma) — üç başlık zorunlu.
- **FCF-temettü açığı kapama senaryoları:** Açık tespit edilirse 3 kapatma yolu (nakit tüketimi, borçlanma, temettü kesintisi) olasılık ağırlıklarıyla sunulmalı.
