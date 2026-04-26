# research_brief — Case Lessons


### 2026-04-23 — EREGL
EREGL: COO blocked iken research_brief GO ilan etti, pipeline hatalı başladı. COO bloğu downstream'e sızdı.

### 2026-04-23 — ARCLK (durable_goods / beyaz eşya)
ARCLK ilk analiz. Çok katmanlı uluslararası yapı (Whirlpool EMEA + Hitachi): IAS 29 kapsam belirleme P0 bloker olarak işaretlendi — fonksiyonel para birimi netleşmeden financial_analysis başlayamaz.
Sub_question kalıbı (standard_institutional 7 soru): IAS29 kapsam | EBITDA marjı trendi | Net Borç/EBITDA + goodwill | FCF/Capex | CCC döngüsü | coğrafi gelir dağılımı | hammadde duyarlılığı.
FX_COMPLEXITY dersi: Çok katmanlı fonksiyonel para birimi yapısında mekanik IAS 29 uygulaması hata üretir — dipnot bazlı tüzel kişilik sınıflandırması zorunlu.

### 2026-04-23 — ARCLK
ARCLK 2026-04-23: COO decision=blocked iken research_brief 'go' onayı verdi; HTML_ENVELOPE ve SPK_DISCLAIMER eksik raporla pipeline sonuna kadar çalıştı. SPK yasal sorumluluk metninin eksik olduğu rapor dağıtılsaydı regülatör uyumsuzluk riski doğardı.

### 2026-04-24 — BIMAS
knowledge_base sub_question_id üzerinden raporladı ama kaynak eşleştirmesi manuel yapıldı. Structured sub_question listesi olsaydı hangi sorunun cevaplanmadığı otomatik tespit edilirdi.

### 2026-04-24 — EREGL (ikinci analiz, baseline güncelleme)
COO decision=go, tüm checkler geçti. standard_institutional mod, 7 structured sub_question (SQ-01..SQ-07) üretildi. P0 sub_question'lar: yeni KAP belgesi sınıflandırması (document_evidence), EBITDA kaynak doğrulaması (kilitli 20,452 mn), FCF normalizasyonu (raw 49,717 mn − WC 45,997 mn), IAS29 adj_NI trendi. Ders: kilitli fact base olan analizlerde yeni belge entegrasyonu (kap_watch/document_evidence) SQ-01 olmalı — önce kapsamı netleştir, sonra doğrula.

### 2026-04-24 — KCHOL (holding, deep_dive, 8 soru)
KCHOL 3× BLOCKED geçmişi (QA 0.45–0.68). Bu oturumda P0 bloker Revenue FY/Q4 ayrımı SQ-01, ARCLK Hitachi deal SOTP etkisi SQ-03, YKBNK konsolidasyon BS düzeltmesi SQ-04 olarak araştırma planına alındı. IFRS 8 segment %0 başarı geçmişi — PT-05'te 4 fallback kaynak sırası zorunlu direktif olarak verildi.
Sub_question kalıbı (holding deep_dive 8 soru): Revenue FY/Q4 P0 disambiguate | SOTP efektif hisse değerleri NAV | ARCLK stake revizesi | YKBNK düzeltilmiş net borç | IFRS 8 segment EBITDA | IAS29 adj_NI holding seviyesi | Holding giderleri/NAV oranı | Holding indirimi peer benchmark.
Holding dersi: YKBNK banka konsolidasyonu — net borç hesabında BS düzeltmesi olmadan holding-only leverage görünmez. SOTP'ta banka iştirakine P/BV çarpanı, sanayi iştiraklerine EV/EBITDA uygulanmalı.

### 2026-04-24 — THYAO (aviation, deep_dive, 8 soru)
THYAO önceki oturum (20260414) CF+SE tablo yokluğundan QA=0.757 BLOCKED kapandı. Bu oturumda P0 bloker olan CF/SE çözümü SQ1 olarak araştırma planına alındı; downstream agentlara "CF+SE teslim edilmeden WC metrik hesabına başlama" direktifi verildi.
Sub_question kalıbı (aviation deep_dive 8 soru): CF/SE P0 çözüm | EBITDAR marj 5yr | RPK/ASK/LF operasyonel KPI | CASK(ex-fuel)/RASK verimlilik | Net Borç/EBITDAR kaldıraç | IAS29 monetary gain ayrıştırması | FCF ve nakit dönüşüm | Global peer benchmark (IAG,LHA,DAL,UAL).
IAS29 dersi: THYAO kısmi USD fonksiyonel para birimi — monetary gain EREGL'e göre daha sınırlı ama TRY raporlama üzerindeki etki izole edilmeli.

### 2026-04-24 — KCHOL
KCHOL 2026-04-24: research_brief COO output'u okumadan 'go' üretti. Tüm downstream 17 agent geçersiz temelde çalıştı.

### 2026-04-24 — KCHOL (standard_institutional, 7 soru — ikinci oturum)
COO decision=go doğrulandı. standard_institutional mod → 7 structured SQ. P0 blokerlar CEO mandate'ten alındı: Revenue FY/Q4 ayrımı, YKBNK ~924B TRY konsolidasyon düzeltmesi, IFRS 8 segment %0 başarı geçmişi. Sub_question kalıbı (holding standard 7 soru): Revenue FY/Q4 P0 disambiguate | SOTP NAV (efektif paylar + ARCLK stake rev.) | Holding-only net borç/EBITDA (YKBNK hariç) | IAS29 adj EBITDA | IFRS 8 segment EBITDA (4 fallback kaynak) | Holding indirimi/prim tarihsel trend | Kurumsal olay SOTP etkisi.

### 2026-04-24 — KCHOL
COO çıktısı iki kritik eksikliği (HTML envelope + SPK disclaimer) tespit etti ama downstream pipeline bu kararı saygıyla karşılamadı. KCHOL raporunun HTML zarfı ve yasal uyarı olmadan teslim edilme riski doğdu.

### 2026-04-25 — KCHOL (standard_institutional, 7 soru — temiz seans)
COO decision=go doğrulandı (4 check: KAP_ACCESS/TCMB_FX/FIVE_YEAR_WINDOW/HOLDING_SOTP_NOTED). standard_institutional mod → 7 structured SQ. CEO mandate'ten gelen P0 direktifler: SOTP 7 segment (TUPRS/OTKAR/ARCLK/YKBNK/AYGAZ/Opet/diğer), IAS29 aktif, YKBNK BS izolasyonu zorunlu, CF tablosu geçmiş P0 bloker. Sub_question kalıbı (holding standard_institutional 7 soru): SOTP/NAV (7 segment, efektif hisse × çarpan) | IAS29 adj EBITDA | YKBNK izolasyonu + holding Net Borç/EBITDA | CF tablosu OCF/FCF P0 doğrulama | IFRS 8 segment EBITDA (4-fallback) | NAV indirimi + SAHOL/KOZAL benchmark | Holding giderleri/NAV oranı. Ders: ARCLK-Hitachi yapısal değişimi (Nisan 2026) SOTP'ta efektif sahiplik revizesi gerektirir — external_research scope'a ekle.

### 2026-04-24 — KCHOL
KCHOL 2026-04-25 (önceki oturum): COO blocked (HTML_ENVELOPE + SPK_DISCLAIMER), research_brief 'go' fabricated. 17 downstream ajan yanlış yola girdi; QA fail'e ulaşmak için gereksiz compute tükendi.

### 2026-04-25 — KCHOL (standard_institutional, 7 soru — confirmed clean)
COO decision=go doğrulandı (4 check PASS). 7 SQ kalıbı sabit: SQ-01 SOTP/NAV (ARCLK-Hitachi sahiplik revizyonu + çift sayım koruması) | SQ-02 IAS29 adj EBITDA | SQ-03 YKBNK izolasyonu + holding Net Borç/EBITDA | SQ-04 CF tablosu OCF/FCF P0 doğrulama | SQ-05 IFRS 8 segment EBITDA (4-fallback) | SQ-06 NAV indirimi + SAHOL/KOZAL/ECZYT benchmark | SQ-07 Holding giderleri/NAV + temettü getirisi.
Aktif P0 blokerlar (4): segment notları (SOTP bloker), CF tablosu, güncel alt şirket fiyatları, IAS29 parasal kazanç. ARCLK-Hitachi Nisan 2026 değişimi external_research scope'a eklendi — SOTP öncesi efektif sahiplik doğrulaması zorunlu.

### 2026-04-25 — KCHOL (deep_dive, 8 soru — ikinci seans aynı gün)
COO decision=go doğrulandı (KAP_ACCESS/TCMB_FX/FIVE_YEAR_WINDOW/HOLDING_SOTP_NOTED 4/4 PASS). deep_dive mod → 8 SQ. CEO mandate'ten gelen 5 P0 bloker araştırma planına entegre edildi: Revenue FY/Q4 (SQ-02), SOTP veri (SQ-01), IFRS8 %0 geçmiş (SQ-03), YKBNK BS izolasyonu (SQ-04), CF tablosu (SQ-05). External research scope: ARCLK-Hitachi Nisan 2026 sahiplik revizyonu, GCM SOTP 406 TRY güncelliği, TUPRS/YKBNK/FROTO makro çapraz etki. Holding discount peer: SAHOL/KOZAL/ECZYT (DOHOL yerine ECZYT eklendi). Ders: deep_dive modda CF tablosu ayrı explicit SQ olmalı — önceki 8-SQ şablonunda gömülüydü, seans başarısı için ayrı P0 olarak işaretlemek gerekiyor.

### 2026-04-25 — KCHOL (standard_institutional, 7 soru — seans kchol-si-20260425)
COO decision=go doğrulandı (4/4 PASS: KAP_ACCESS/TCMB_FX/FIVE_YEAR_WINDOW/HOLDING_SOTP_NOTED). standard_institutional mod → 7 SQ kalıbı belleğe tam uyumlu üretildi. P0 blokerlar (4 adet) CEO mandate'ten alındı ve her SQ'ya eşlendi. External research: ARCLK-Hitachi sahiplik revizyonu + GCM consensus + TUPRS/FROTO makro çapraz etki. SQ-01 SOTP rag+external [P0], SQ-02 Revenue FY/Q4 rag [P0], SQ-03 IFRS8 segment rag 4-fallback [P0], SQ-04 YKBNK izolasyon rag+calc [P0], SQ-05 CF tablosu rag [P0], SQ-06 IAS29 rag+calc [P1], SQ-07 NAV indirimi peer rag+external [P1]. Ders: KCHOL için 5 SQ P0 işaretlenmesi artık standart — CF + IFRS8 + YKBNK + Revenue + SOTP zinciri kırılırsa valuation_agent körelir.

### 2026-04-26 — KCHOL (standard_institutional, 7 soru — seans KCHOL-20260426-STD-001)
COO decision=go doğrulandı (4/4 PASS: KAP_ACCESS/TCMB_FX/FIVE_YEAR_WINDOW/HOLDING_SOTP_NOTED). standard_institutional mod → 7 SQ kalıbı korundu. CEO mandate P0 direktifleri: IFRS8_segment_extraction (0% geçmiş başarı, 4-fallback zorunlu), REVENUE_FY_vs_Q4 (FY2025=2.76T/Q4=802.7B karıştırma yasak), KAP_PDF_SCRIPT fallback=WebFetch 1. seçenek. External research scope sabit: ARCLK-Hitachi Nisan 2026 sahiplik + GCM SOTP consensus + TUPRS/FROTO makro çapraz. 7-SQ kalıbı artık KCHOL standard_institutional için frozen — yeni oturumda yeniden üretmek yerine case_lessons'tan al.
